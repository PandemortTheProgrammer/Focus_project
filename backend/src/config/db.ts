import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let dbInstance: Database | null = null;
let transactionQueue: Promise<void> = Promise.resolve();

interface ValidacionRow {
    Id_perfil: number;
    evento: string;
    acumulador: number;
    ultimo_registro: string | null;
    datos_json: string;
}

interface EventoLegacyRow {
    Id_perfil: number;
    evento: string;
    clave_evento: string;
    fecha_otorgamiento: string | null;
}

interface LecturaLegacyRow {
    Id_perfil: number;
    Id_reporte: number;
    fecha_primera_lectura: string | null;
}

const existeTabla = async (db: Database, tabla: string): Promise<boolean> => {
    const fila = await db.get<{ existe: number }>(
        "SELECT 1 AS existe FROM sqlite_master WHERE type = 'table' AND name = ?",
        [tabla]
    );
    return Boolean(fila);
};

const leerObjetoJson = (contenido: string | null | undefined): Record<string, unknown> => {
    if (!contenido) return {};
    try {
        const valor: unknown = JSON.parse(contenido);
        return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
            ? valor as Record<string, unknown>
            : {};
    } catch {
        return {};
    }
};

const leerIdsJson = (objeto: Record<string, unknown>, campo: string): number[] => {
    const valores = objeto[campo];
    if (!Array.isArray(valores)) return [];
    return [...new Set(valores
        .map(Number)
        .filter((valor) => Number.isSafeInteger(valor) && valor > 0))];
};

const leerClavesJson = (objeto: Record<string, unknown>): string[] =>
    Array.isArray(objeto.claves)
        ? [...new Set(objeto.claves.filter((clave): clave is string => typeof clave === 'string'))]
        : [];

const guardarValidacionMigrada = async (
    db: Database,
    idPerfil: number,
    evento: string,
    acumulador: number,
    ultimoRegistro: string | null,
    datos: Record<string, unknown>
): Promise<void> => {
    const existente = await db.get<ValidacionRow>(
        'SELECT * FROM Perfil_Validacion WHERE Id_perfil = ? AND evento = ?',
        [idPerfil, evento]
    );
    const datosExistentes = leerObjetoJson(existente?.datos_json);
    const datosFinales = { ...datosExistentes, ...datos };

    for (const campo of ['ids', 'claves']) {
        const idsCombinados = [...new Set([
            ...leerIdsJson(datosExistentes, campo),
            ...leerIdsJson(datos, campo)
        ])];
        if (idsCombinados.length > 0) datosFinales[campo] = idsCombinados;
    }

    await db.run(`
        INSERT INTO Perfil_Validacion
            (Id_perfil, evento, acumulador, ultimo_registro, datos_json)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(Id_perfil, evento) DO UPDATE SET
            acumulador = MAX(Perfil_Validacion.acumulador, excluded.acumulador),
            ultimo_registro = CASE
                WHEN Perfil_Validacion.ultimo_registro IS NULL THEN excluded.ultimo_registro
                WHEN excluded.ultimo_registro IS NULL THEN Perfil_Validacion.ultimo_registro
                ELSE MAX(Perfil_Validacion.ultimo_registro, excluded.ultimo_registro)
            END,
            datos_json = excluded.datos_json
    `, [
        idPerfil,
        evento,
        Math.max(existente?.acumulador ?? 0, acumulador),
        ultimoRegistro,
        JSON.stringify(datosFinales)
    ]);
};

const migrarTablasDeValidacion = async (db: Database): Promise<void> => {
    const columnasRecompensaPerfil = await db.all<{ name: string }[]>(
        'PRAGMA table_info(Perfil_Recompensa)'
    );
    if (!columnasRecompensaPerfil.some((columna) => columna.name === 'xp_procesada')) {
        await db.exec(`
            ALTER TABLE Perfil_Recompensa
            ADD COLUMN xp_procesada INTEGER NOT NULL DEFAULT 0
        `);
    }

    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
        if (await existeTabla(db, 'Perfil_Recompensa_XP')) {
            await db.run(`
                UPDATE Perfil_Recompensa
                SET xp_procesada = 1
                WHERE EXISTS (
                    SELECT 1 FROM Perfil_Recompensa_XP px
                    WHERE px.Id_perfil = Perfil_Recompensa.Id_perfil
                        AND px.Id_recompensa = Perfil_Recompensa.Id_recompensa
                )
            `);
            const pendientesDeMigrar = await db.get<{ total: number }>(`
                SELECT COUNT(*) AS total
                FROM Perfil_Recompensa_XP px
                LEFT JOIN Perfil_Recompensa pr
                    ON pr.Id_perfil = px.Id_perfil
                    AND pr.Id_recompensa = px.Id_recompensa
                WHERE pr.Id_recompensa IS NULL OR pr.xp_procesada <> 1
            `);
            if (Number(pendientesDeMigrar?.total ?? 0) > 0) {
                throw new Error('No se pudieron verificar todas las recompensas XP antes de migrar.');
            }
        }

        if (await existeTabla(db, 'Perfil_XP_Evento')) {
            const eventos: EventoLegacyRow[] = await db.all(`
                SELECT Id_perfil, evento, clave_evento, fecha_otorgamiento
                FROM Perfil_XP_Evento
                ORDER BY Id_perfil, evento, fecha_otorgamiento
            `);
            const grupos = new Map<string, EventoLegacyRow[]>();
            for (const evento of eventos) {
                const clave = `${evento.Id_perfil}:${evento.evento}`;
                const grupo = grupos.get(clave) ?? [];
                grupo.push(evento);
                grupos.set(clave, grupo);
            }

            for (const grupo of grupos.values()) {
                const primero = grupo[0];
                const fechas = grupo
                    .map((evento) => evento.fecha_otorgamiento)
                    .filter((fecha): fecha is string => Boolean(fecha))
                    .sort();
                const ultimaFecha = fechas[fechas.length - 1] ?? null;

                if (primero.evento === 'ENFOQUE_PROBADO' || primero.evento === 'ENFOQUES_PROBADOS') {
                    const ids = [...new Set(grupo
                        .map((evento) => Number(evento.clave_evento))
                        .filter((id) => Number.isSafeInteger(id) && id > 0))];
                    await guardarValidacionMigrada(
                        db, primero.Id_perfil, 'ENFOQUES_PROBADOS', ids.length, ultimaFecha, { ids }
                    );
                } else if (primero.evento === 'CAMBIO_ENFOQUE') {
                    await guardarValidacionMigrada(
                        db, primero.Id_perfil, primero.evento, grupo.length, ultimaFecha, {}
                    );
                } else if (primero.evento === 'VISITA_MI_PROGRESO') {
                    await guardarValidacionMigrada(
                        db,
                        primero.Id_perfil,
                        primero.evento,
                        grupo.length,
                        ultimaFecha,
                        {}
                    );
                } else {
                    const claves = [...new Set(grupo.map((evento) => evento.clave_evento))];
                    await guardarValidacionMigrada(
                        db,
                        primero.Id_perfil,
                        primero.evento,
                        primero.evento === 'PIN_PRIMERA_VEZ' ? 1 : claves.length,
                        ultimaFecha,
                        { claves }
                    );
                }

                const eventoNuevo = primero.evento === 'ENFOQUE_PROBADO'
                    ? 'ENFOQUES_PROBADOS'
                    : primero.evento;
                const validacionMigrada = await db.get<ValidacionRow>(`
                    SELECT * FROM Perfil_Validacion
                    WHERE Id_perfil = ? AND evento = ?
                `, [primero.Id_perfil, eventoNuevo]);
                const datosMigrados = leerObjetoJson(validacionMigrada?.datos_json);
                const migracionVerificada = primero.evento === 'ENFOQUE_PROBADO' ||
                    primero.evento === 'ENFOQUES_PROBADOS'
                    ? grupo.every((evento) => leerIdsJson(datosMigrados, 'ids').includes(Number(evento.clave_evento)))
                    : primero.evento === 'CAMBIO_ENFOQUE'
                        ? Number(validacionMigrada?.acumulador ?? 0) >= grupo.length
                        : primero.evento === 'VISITA_MI_PROGRESO'
                            ? Boolean(validacionMigrada?.ultimo_registro)
                            : grupo.every((evento) => leerClavesJson(datosMigrados).includes(evento.clave_evento));
                if (!migracionVerificada) {
                    throw new Error(`No se pudo verificar la migración del evento ${primero.evento}.`);
                }
            }
        }

        if (await existeTabla(db, 'Perfil_Reporte_Lectura')) {
            const lecturas: LecturaLegacyRow[] = await db.all(`
                SELECT Id_perfil, Id_reporte, fecha_primera_lectura
                FROM Perfil_Reporte_Lectura
                ORDER BY Id_perfil, fecha_primera_lectura
            `);
            const grupos = new Map<number, LecturaLegacyRow[]>();
            for (const lectura of lecturas) {
                const grupo = grupos.get(lectura.Id_perfil) ?? [];
                grupo.push(lectura);
                grupos.set(lectura.Id_perfil, grupo);
            }

            for (const [idPerfil, grupo] of grupos) {
                const ids = [...new Set(grupo.map((lectura) => Number(lectura.Id_reporte)))];
                const fechas = grupo
                    .map((lectura) => lectura.fecha_primera_lectura)
                    .filter((fecha): fecha is string => Boolean(fecha))
                    .sort();
                const ultimaFecha = fechas[fechas.length - 1] ?? null;
                await guardarValidacionMigrada(
                    db, idPerfil, 'LECTURA_REPORTE', ids.length, ultimaFecha, { ids }
                );
                const validacionMigrada = await db.get<ValidacionRow>(`
                    SELECT * FROM Perfil_Validacion
                    WHERE Id_perfil = ? AND evento = 'LECTURA_REPORTE'
                `, [idPerfil]);
                const idsMigrados = leerIdsJson(
                    leerObjetoJson(validacionMigrada?.datos_json),
                    'ids'
                );
                if (!ids.every((id) => idsMigrados.includes(id))) {
                    throw new Error('No se pudieron verificar todas las lecturas de reportes antes de migrar.');
                }
            }
        }

        if (await existeTabla(db, 'Perfil')) {
            await db.run(`
                INSERT INTO Perfil_Validacion
                    (Id_perfil, evento, acumulador, ultimo_registro, datos_json)
                SELECT Id_perfil, 'PIN_PRIMERA_VEZ', 1, CURRENT_TIMESTAMP, '{}'
                FROM Perfil
                WHERE pin IS NOT NULL
                ON CONFLICT(Id_perfil, evento) DO NOTHING
            `);
        }

        for (const tabla of [
            'Perfil_Recompensa_XP',
            'Perfil_XP_Evento',
            'Perfil_Reporte_Lectura'
        ]) {
            if (await existeTabla(db, tabla)) await db.exec(`DROP TABLE ${tabla}`);
        }
        await db.exec('COMMIT');
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
};

export const inicializarBD = async () => {
    if (dbInstance) return dbInstance;

    try {
        dbInstance = await open({
            filename: './focus_database.sqlite',
            driver: sqlite3.Database
        });

        // Habilitar Llaves Foráneas (SQLite las trae apagadas por defecto)
        await dbInstance.exec('PRAGMA foreign_keys = ON;');
        console.log("Base de Datos SQLite conectada con éxito.");

        // ==========================================
        // 1. CREACIÓN DE TABLAS INDEPENDIENTES
        // ==========================================

        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS Enfoque (
                Id_enfoque INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_enf VARCHAR(20) NOT NULL,
                descrip_enf VARCHAR(120)
            );

            CREATE TABLE IF NOT EXISTS Tipo_actividad (
                Id_tipo INTEGER PRIMARY KEY AUTOINCREMENT,
                Nombre_activ VARCHAR(20) NOT NULL,
                Utilidad_objet INTEGER CHECK(Utilidad_objet <= 5),
                Codigo_color VARCHAR(7) NOT NULL,
                nivel_presencia INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS Icono (
                Id_icono INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_icono VARCHAR(50) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Tarjeta (
                Id_tarjeta INTEGER PRIMARY KEY,
                nombre_tarjeta TEXT NOT NULL
            );
        `);

        // ==========================================
        // 2. CREACIÓN DE TABLAS DEPENDIENTES
        // ==========================================

        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS Perfil (
                Id_perfil INTEGER PRIMARY KEY,
                nickname VARCHAR(20) NOT NULL,
                rango_edad VARCHAR(15) NOT NULL,
                Id_enfoque INTEGER,
                genero VARCHAR(1) NOT NULL,
                Id_icono INTEGER NOT NULL DEFAULT 1,
                pin VARCHAR(4) DEFAULT NULL,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                nivel INTEGER DEFAULT 1,
                xp_acumulada INTEGER DEFAULT 0,
                Id_tarjeta INTEGER DEFAULT NULL,
                FOREIGN KEY (Id_enfoque) REFERENCES Enfoque(Id_enfoque) ON DELETE SET NULL,
                FOREIGN KEY (Id_icono) REFERENCES Icono(Id_icono) ON DELETE SET NULL,
                FOREIGN KEY (Id_tarjeta) REFERENCES Tarjeta(Id_tarjeta) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS Actividad (
                Id_actividad INTEGER PRIMARY KEY AUTOINCREMENT,
                Id_tipo INTEGER NOT NULL,
                desc_activ VARCHAR(255),
                fecha DATE DEFAULT CURRENT_DATE,
                hora_inicio VARCHAR(5) NOT NULL,
                durac_min INTEGER CHECK(durac_min < 1440),
                hora_creac DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (Id_tipo) REFERENCES Tipo_actividad(Id_tipo) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Reporte_semanal (
                Id_reporte INTEGER PRIMARY KEY AUTOINCREMENT,
                Id_enfoque INTEGER NOT NULL,
                Fecha_i_semana DATE,
                Fecha_f_semana DATE,
                Conclusion VARCHAR(255),
                Prog_optimizac INTEGER CHECK(Prog_optimizac <= 100),
                FOREIGN KEY (Id_enfoque) REFERENCES Enfoque(Id_enfoque) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Recompensa (
                Id_recompensa INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_recompensa VARCHAR(50) NOT NULL,
                descripcion VARCHAR(150),
                tipo_recompensa VARCHAR(20) NOT NULL,
                Id_desbloqueado INTEGER, -- NUEVO NOMBRE: Relación polimórfica (sin llave foránea estricta)
                coleccion VARCHAR(20) DEFAULT 'V1',
                xp_otorgada INTEGER DEFAULT 1000
            );

            CREATE TABLE IF NOT EXISTS Perfil_Recompensa (
                Id_perfil INTEGER,
                Id_recompensa INTEGER,
                fecha_obtencion DATETIME DEFAULT CURRENT_TIMESTAMP,
                xp_procesada INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (Id_perfil, Id_recompensa),
                FOREIGN KEY (Id_perfil) REFERENCES Perfil(Id_perfil) ON DELETE CASCADE,
                FOREIGN KEY (Id_recompensa) REFERENCES Recompensa(Id_recompensa) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Perfil_Validacion (
                Id_perfil INTEGER NOT NULL,
                evento TEXT NOT NULL,
                acumulador INTEGER NOT NULL DEFAULT 0,
                ultimo_registro DATETIME,
                datos_json TEXT NOT NULL DEFAULT '{}',
                PRIMARY KEY (Id_perfil, evento),
                FOREIGN KEY (Id_perfil) REFERENCES Perfil(Id_perfil) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Dia_Ideal_Bloques (
                id_bloque INTEGER PRIMARY KEY AUTOINCREMENT,
                id_tipo INTEGER NOT NULL,
                duracion_minutos INTEGER NOT NULL,
                hora_inicio TEXT,
                FOREIGN KEY (id_tipo) REFERENCES Tipo_actividad(Id_tipo) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Plantilla_Actividad (
                id_plantilla INTEGER PRIMARY KEY AUTOINCREMENT,
                id_tipo INTEGER NOT NULL,
                titulo_plantilla VARCHAR(50) NOT NULL,
                desc_activ_default VARCHAR(255),
                durac_min_default INTEGER,
                FOREIGN KEY (id_tipo) REFERENCES Tipo_actividad(Id_tipo) ON DELETE CASCADE
            );
        `);

        await migrarTablasDeValidacion(dbInstance);

        // Parche inicial icono en perfil
        try {
            const perfilActual = await dbInstance.get("SELECT Id_icono, icono FROM Perfil LIMIT 1");
            if (perfilActual && (perfilActual.Id_icono === null || perfilActual.Id_icono === 0) && perfilActual.icono) {
                const idExtraido = parseInt(String(perfilActual.icono).match(/\d+/)?.[0] ?? '1', 10);
                await dbInstance.run("UPDATE Perfil SET Id_icono = ? WHERE Id_perfil = 1", [Number.isNaN(idExtraido) ? 1 : idExtraido]);
            }
        } catch {}

        // ==========================================
        // 3. MIGRACIONES Y PARCHES (V2)
        // ==========================================
        try {
            const columnasPerfil = await dbInstance.all("PRAGMA table_info(Perfil)");
            const tieneNivel = columnasPerfil.some((col: any) => col.name === 'nivel');
            const tieneXp = columnasPerfil.some((col: any) => col.name === 'xp_acumulada');
            const tieneIdTarjeta = columnasPerfil.some((col: any) => col.name === 'Id_tarjeta');

            if (!tieneNivel) {
                console.log("Aplicando parche V2: Agregando 'nivel' a Perfil...");
                await dbInstance.run("ALTER TABLE Perfil ADD COLUMN nivel INTEGER DEFAULT 1");
            }
            if (!tieneXp) {
                console.log("Aplicando parche V2: Agregando 'xp_acumulada' a Perfil...");
                await dbInstance.run("ALTER TABLE Perfil ADD COLUMN xp_acumulada INTEGER DEFAULT 0");
            }
            if (!tieneIdTarjeta) {
                console.log("Aplicando parche V2: Agregando 'Id_tarjeta' a Perfil...");
                await dbInstance.run("ALTER TABLE Perfil ADD COLUMN Id_tarjeta INTEGER REFERENCES Tarjeta(Id_tarjeta) DEFAULT NULL");
            }

            // A) Parche de Recompensa (Polimorfismo, Colecciones y XP)
            const columnasRecompensa = await dbInstance.all("PRAGMA table_info(Recompensa)");
            const tieneIdIcono = columnasRecompensa.some((col: any) => col.name === 'Id_icono');
            const tieneIdDesbloqueado = columnasRecompensa.some((col: any) => col.name === 'Id_desbloqueado');
            const tieneColeccion = columnasRecompensa.some((col: any) => col.name === 'coleccion');
            const tieneXpOtorgada = columnasRecompensa.some((col: any) => col.name === 'xp_otorgada');
            const clavesForaneasRecompensa = await dbInstance.all("PRAGMA foreign_key_list(Recompensa)");
            const referenciaPolimorficaConClaveForanea = clavesForaneasRecompensa.some(
                (clave: any) => clave.from === 'Id_desbloqueado' && clave.table === 'Icono'
            );

            if (tieneIdIcono || !tieneIdDesbloqueado || referenciaPolimorficaConClaveForanea) {
                console.log("Migrando Recompensa a la relación polimórfica sin clave foránea...");
                const valorDesbloqueado = tieneIdIcono ? 'Id_icono' : tieneIdDesbloqueado ? 'Id_desbloqueado' : 'NULL';
                const valorColeccion = tieneColeccion ? "COALESCE(coleccion, 'V1')" : "'V1'";
                const valorXp = tieneXpOtorgada ? 'COALESCE(xp_otorgada, 1000)' : '1000';

                await dbInstance.exec('PRAGMA foreign_keys = OFF');
                let transaccionIniciada = false;
                try {
                    await dbInstance.exec('BEGIN IMMEDIATE');
                    transaccionIniciada = true;
                    await dbInstance.exec(`
                        DROP TABLE IF EXISTS Recompensa_migracion;
                        CREATE TABLE Recompensa_migracion (
                            Id_recompensa INTEGER PRIMARY KEY AUTOINCREMENT,
                            nombre_recompensa VARCHAR(50) NOT NULL,
                            descripcion VARCHAR(150),
                            tipo_recompensa VARCHAR(20) NOT NULL,
                            Id_desbloqueado INTEGER,
                            coleccion VARCHAR(20) DEFAULT 'V1',
                            xp_otorgada INTEGER DEFAULT 1000
                        )
                    `);
                    await dbInstance.exec(`
                        INSERT INTO Recompensa_migracion (
                            Id_recompensa, nombre_recompensa, descripcion, tipo_recompensa,
                            Id_desbloqueado, coleccion, xp_otorgada
                        )
                        SELECT
                            Id_recompensa, nombre_recompensa, descripcion, tipo_recompensa,
                            ${valorDesbloqueado}, ${valorColeccion}, ${valorXp}
                        FROM Recompensa
                    `);
                    await dbInstance.exec(`
                        DROP TABLE Recompensa;
                        ALTER TABLE Recompensa_migracion RENAME TO Recompensa;
                    `);
                    await dbInstance.exec('COMMIT');
                    transaccionIniciada = false;
                } catch (error) {
                    if (transaccionIniciada) {
                        try {
                            await dbInstance.exec('ROLLBACK');
                        } catch (rollbackError) {
                            console.error("Error al revertir la migración polimórfica de Recompensa:", rollbackError);
                        }
                    }
                    throw error;
                } finally {
                    await dbInstance.exec('PRAGMA foreign_keys = ON');
                }
            }

            if (!tieneColeccion && !tieneIdIcono && !referenciaPolimorficaConClaveForanea) {
                console.log("Aplicando parche V2: Agregando 'coleccion' a Recompensa...");
                await dbInstance.run("ALTER TABLE Recompensa ADD COLUMN coleccion VARCHAR(20) DEFAULT 'V1'");
            }
            if (!tieneXpOtorgada && !tieneIdIcono && !referenciaPolimorficaConClaveForanea) {
                console.log("Aplicando parche V2: Agregando 'xp_otorgada' a Recompensa...");
                await dbInstance.run("ALTER TABLE Recompensa ADD COLUMN xp_otorgada INTEGER DEFAULT 1000");
            }

            // B) Parche Nivel Presencia
            const columnasActividad = await dbInstance.all("PRAGMA table_info(Tipo_actividad)");
            if (!columnasActividad.some((col: any) => col.name === 'nivel_presencia')) {
                console.log("Aplicando parche V2: Agregando 'nivel_presencia' a Tipo_actividad...");
                await dbInstance.run("ALTER TABLE Tipo_actividad ADD COLUMN nivel_presencia INTEGER DEFAULT 1");
            }
            await dbInstance.run("UPDATE Tipo_actividad SET nivel_presencia = 0 WHERE Nombre_activ = 'Dormir'");
            await dbInstance.run("UPDATE Tipo_actividad SET nivel_presencia = 2 WHERE Nombre_activ IN ('Socializar', 'Descanso activo', 'Series o Películas', 'Música', 'Redes sociales')");

            // C) Parches Perfil (Resto de parches originales)
            if (!columnasPerfil.some((col: any) => col.name === 'pin')) {
                await dbInstance.run("ALTER TABLE Perfil ADD COLUMN pin VARCHAR(4) DEFAULT NULL");
            }
            if (!columnasPerfil.some((col: any) => col.name === 'pista_pin')) {
                await dbInstance.run("ALTER TABLE Perfil ADD COLUMN pista_pin VARCHAR(60) DEFAULT NULL");
            }
            if (!columnasPerfil.some((col: any) => col.name === 'fecha_creacion')) {
                await dbInstance.run("ALTER TABLE Perfil ADD COLUMN fecha_creacion DATETIME");
            }
            await dbInstance.run(`
                UPDATE Perfil
                SET fecha_creacion = COALESCE(
                    fecha_creacion,
                    (SELECT MIN(fecha) || ' 00:00:00' FROM Actividad),
                    CURRENT_TIMESTAMP
                )
                WHERE fecha_creacion IS NULL
            `);

            // D) Creación de nuevas tablas V2
            const tablas = await dbInstance.all("SELECT name FROM sqlite_master WHERE type='table' AND name='Dia_Ideal_Bloques'");
            if (tablas.length === 0) {
                await dbInstance.exec(`
                    CREATE TABLE Dia_Ideal_Bloques (
                        id_bloque INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_tipo INTEGER NOT NULL,
                        duracion_minutos INTEGER NOT NULL,
                        hora_inicio TEXT,
                        FOREIGN KEY (id_tipo) REFERENCES Tipo_actividad(Id_tipo) ON DELETE CASCADE
                    );
                `);
            }

            const tablasPlantilla = await dbInstance.all("SELECT name FROM sqlite_master WHERE type='table' AND name='Plantilla_Actividad'");
            if (tablasPlantilla.length === 0) {
                await dbInstance.exec(`
                    CREATE TABLE Plantilla_Actividad (
                        id_plantilla INTEGER PRIMARY KEY AUTOINCREMENT,
                        id_tipo INTEGER NOT NULL,
                        titulo_plantilla VARCHAR(50) NOT NULL,
                        desc_activ_default VARCHAR(255),
                        durac_min_default INTEGER,
                        FOREIGN KEY (id_tipo) REFERENCES Tipo_actividad(Id_tipo) ON DELETE CASCADE
                    );
                `);
            }

            console.log("Migración V2 completada exitosamente.");
        } catch (error) {
            console.error("Error al aplicar las migraciones de la V2:", error);
            throw error;
        }

        // ==========================================
        // 4. POBLAR CATÁLOGOS (V1 y V2)
        // ==========================================

        const tiposExisten = await dbInstance.get("SELECT COUNT(*) as count FROM Tipo_actividad");
        if (tiposExisten.count === 0) {
            await dbInstance.exec(`
                INSERT INTO Tipo_actividad (Nombre_activ, Utilidad_objet, Codigo_color, nivel_presencia) VALUES
                ('Comer', 5, '#eab308', 1),
                ('Expresión artística', 3, '#f97316', 1),
                ('Cuidado de mascotas', 4, '#ed75ff', 1),
                ('Realizar un trámite', 2, '#1f7b71', 1),
                ('Planificación de actividades', 4, '#4c9088', 1),
                ('Familia', 5, '#b227c7', 1),
                ('Pareja', 5, '#9624a7', 1),
                ('Higiene personal', 5, '#f5d986', 1),
                ('Meditación', 3, '#1352b8', 1),
                ('Transporte', 4, '#759692', 1),
                ('Socializar', 3, '#d233eb', 2),
                ('Tareas del hogar', 4, '#275751', 1),
                ('Ir de Compras (ocio)', 2, '#ff987a', 1),
                ('Hacer el mandado', 4, '#135850', 1),
                ('Ir al médico', 5, '#81734a', 1),
                ('Autocuidado', 4, '#d946ef', 1),
                ('Proyecto personal', 5, '#008575', 1),
                ('Descanso activo', 3, '#0062ff', 2),
                ('Estudio', 5, '#1a7a6e', 1),
                ('Dormir', 5, '#3b82f6', 0),
                ('Actividad física', 4, '#872d95', 1),
                ('Lectura', 4, '#bb570f', 1),
                ('Trabajo', 3, '#20ab9a', 1),
                ('Series o Películas', 2, '#7062ef', 2),
                ('Música', 2, '#ff987a', 2),
                ('Videojuegos', 1, '#8b7fef', 1),
                ('Redes sociales', 1, '#6d6999', 2);

                INSERT INTO Enfoque (nombre_enf, descrip_enf) VALUES
                ('Académico', 'Prioriza actividades de estudio y aprendizaje'),
                ('Tiempo libre', 'Prioriza recuperar tiempo libre en una vida ajetreada'),
                ('Atlético', 'Prioriza actividades que conlleven ejercicio'),
                ('Económico', 'Prioriza actividades que te ofrezcan algún beneficio económico'),
                ('Salud mental y descanso', 'Prioriza actividades que te ofrezcan tranquilidad emocional y mejora en tu calidad de vida'),
                ('Flexibilidad', 'Prioriza desarrollar tus actividades de manera que te permitan adaptarte a cambios y situaciones imprevistas'),
                ('Equilibrado', 'Balance entre trabajo, salud y descanso');
            `);
            console.log("Catálogos de Actividades y Enfoques insertados.");
        }

        await dbInstance.exec(`
            INSERT OR IGNORE INTO Tarjeta (Id_tarjeta, nombre_tarjeta) VALUES
            (1, 'Tarjeta Base'),
            (2, 'Oficina de los lightys'),
            (3, 'En la antigua lightrecia'),
            (4, 'Brainy y Lighty en el bosque'),
            (5, 'Pagoda ante el Fuji'),
            (6, 'Purple lighty, Angry Lighty y Shadow lighty'),
            (7, 'Anne otoñal ante Lize primaveral'),
            (8, 'The champion'),
            (9, 'Focus, pero nivel 40');

            INSERT OR IGNORE INTO Icono (Id_icono, nombre_icono) VALUES
            (1, 'Sin icono (usar inicial)'),
            (2, 'Espíritu Novato'),
            (3, 'Lighty Realista'),
            (4, 'Maratonista'),
            (5, 'Reflexivo'),
            (6, 'Maestro del Tiempo'),
            (7, 'Dark Lighty'),
            (8, 'Lighty'),
            (9, 'Medalla Dorada'),
            (10, 'Lechuza Coronada'),
            (11, '¿Eso es una ciudad?'),
            (12, 'Coleccionista'),
            (13, 'Mariposa'),
            (14, 'Anne'),
            (15, 'Reloj de Arena'),
            (16, 'Sonámbulo'),
            (17, 'Joven'),
            (18, 'Sabio'),
            (19, 'Ganador'),
            (20, 'Clon'),
            (21, 'Mundo salvado'),
            (22, 'Filosotiempo'),
            (23, 'Escudo Guardián'),
            (24, 'Ella definitivamente sí'),
            (25, 'Ancestral'),
            (26, 'Agregado a la enciclopedia'),
            (27, 'El que está detrás de la pantalla'),
            (28, 'Sin rumbo'),
            (29, 'Definitivamente no es una beta'),
            (30, 'Trascendido');

            -- Nótese que Id_icono ahora se llama Id_desbloqueado
            INSERT OR IGNORE INTO Recompensa (Id_recompensa, nombre_recompensa, descripcion, tipo_recompensa, Id_desbloqueado, coleccion, xp_otorgada) VALUES
            (1, 'Bienvenida', 'Tu primer perfil en Focus', 'ICONO', 2, 'V1', 1000),
            (2, 'Iniciador', 'Registraste tu primera actividad', 'ICONO', 3, 'V1', 1000),
            (3, 'Registrador', 'Alcanzaste 10 horas de actividades', 'ICONO', 4, 'V1', 2500),
            (4, 'Analista', 'Revisaste tu primer reporte semanal', 'ICONO', 5, 'V1', 1000),
            (5, 'Y este es solo el segundo', 'Recibiste tu segundo reporte semanal', 'ICONO', 6, 'V1', 2000),
            (6, 'Coleccionista', 'Exploraste todas las funciones de la aplicación', 'ICONO', 7, 'V1', 1000),
            (7, 'Salvado', 'Descargaste tu perfil por primera vez', 'ICONO', 8, 'V1', 1000),
            (8, 'Imparable', 'Registraste 50 actividades en la plataforma', 'ICONO', 9, 'V1', 5000),
            (9, 'Lechuza', 'Registraste una actividad después de medianoche', 'ICONO', 10, 'V1', 1000),
            (10, 'Gestor', 'Visita tu progreso semanal por primera vez', 'ICONO', 11, 'V1', 1000),
            (11, 'Integral', 'Registra una actividad de cada tipo al menos una vez', 'ICONO', 12, 'V1', 4000),
            (12, 'Evolución', 'Edita tu perfil por primera vez', 'ICONO', 13, 'V1', 1000),
            (13, 'Constante', 'Recibe 4 reportes semanales', 'ICONO', 14, 'V1', 2500),
            (14, '¿Ha pasado un año?', 'Ha pasado un año, si', 'ICONO', 15, 'V1', 6000),
            (15, 'Madrugador', 'Registraste una actividad tan pronto iniciaste tu día', 'ICONO', 16, 'V1', 1000),
            (16, 'Un nuevo comienzo', 'Recibe el primer reporte semanal bajo un nuevo enfoque', 'ICONO', 17, 'V1', 2000),
            (17, 'Recordando viejos tiempos', 'Exploraste tu historial de actividades por primera vez', 'ICONO', 18, 'V1', 1000),
            (18, 'Gran Maestro de los logros (de la versión 1)', 'Conseguiste todos los logros de Focus (v1)', 'ICONO', 19, 'V1', 10000),

            (19, '¿Clonar?', 'Crear tu primera plantilla', 'ICONO', 20, 'V2', 1000),
            (20, 'Reciclaje de manual', 'Crear 10 plantillas', 'ICONO', 21, 'V2', 2500),
            (21, 'Eficiencia suprema', 'Crear 10 actividades sin salir del formulario', 'ICONO', 22, 'V2', 4000),
            (22, 'Blindaje', 'Configura un PIN', 'ICONO', 23, 'V2', 1000),
            (23, '¿Sólo tu sabes esto?', 'Asignar una frase clave para recordar el PIN', 'ICONO', 24, 'V2', 1000),
            (24, 'Reviviendo acciones pasadas', 'Crear una plantilla basada en una actividad con más de dos semanas de antigüedad', 'ICONO', 25, 'V2', 2000),
            (25, 'Consultando el catálogo', 'Visitar por primera vez la lista de plantillas', 'ICONO', 26, 'V2', 1000),
            (26, 'Aprendiendo más de mis decisiones', 'Visitar por primera vez "Conoce tu enfoque"', 'ICONO', 27, 'V2', 1000),
            (27, 'Indeciso', 'Prueba todos los enfoques al menos una vez', 'ICONO', 28, 'V2', 4000),
            (28, '¿Acaso te consideras Beta Tester?', 'Ten al menos un reporte semanal por cada enfoque', 'ICONO', 29, 'V2', 6000),
            (29, 'Mi legado', 'Visita "Mi progreso" por primera vez', 'ICONO', 30, 'V2', 1000),

            -- Recompensas de tipo Hito vinculadas a las Tarjetas (Id_desbloqueado apunta a Tarjeta(Id_tarjeta))
            (1001, 'Nivel 5: Iniciado', 'Alcanzaste el nivel 5, desbloqueaste una nueva tarjeta de perfil', 'CARD', 2, 'HITO', 0),
            (1002, 'Nivel 10: Aprendiz', 'Alcanzaste el nivel 10, desbloqueaste una nueva tarjeta de perfil', 'CARD', 3, 'HITO', 0),
            (1003, 'Nivel 15: Incrementado', 'Alcanzaste el nivel 15, desbloqueaste una nueva tarjeta de perfil', 'CARD', 4, 'HITO', 0),
            (1004, 'Nivel 20: Preformado', 'Alcanzaste el nivel 20, desbloqueaste una nueva tarjeta de perfil', 'CARD', 5, 'HITO', 0),
            (1005, 'Nivel 25: Conocedor', 'Alcanzaste el nivel 25, desbloqueaste una nueva tarjeta de perfil', 'CARD', 6, 'HITO', 0),
            (1006, 'Nivel 30: Hábil', 'Alcanzaste el nivel 30, desbloqueaste una nueva tarjeta de perfil', 'CARD', 7, 'HITO', 0),
            (1007, 'Nivel 35: Avanzado', 'Alcanzaste el nivel 35, desbloqueaste una nueva tarjeta de perfil', 'CARD', 8, 'HITO', 0),
            (1008, 'Nivel 40: ¿Maestro?', 'Alcanzaste el nivel 40, desbloqueaste una nueva tarjeta de perfil', 'CARD', 9, 'HITO', 0);
        `);

        await dbInstance.run(`
            UPDATE Recompensa
            SET xp_otorgada = CASE Id_recompensa
                WHEN 1 THEN 1000 WHEN 2 THEN 1000 WHEN 3 THEN 2500
                WHEN 4 THEN 1000 WHEN 5 THEN 2000 WHEN 6 THEN 1000
                WHEN 7 THEN 1000 WHEN 8 THEN 5000 WHEN 9 THEN 1000
                WHEN 10 THEN 1000 WHEN 11 THEN 4000 WHEN 12 THEN 1000
                WHEN 13 THEN 2500 WHEN 14 THEN 6000 WHEN 15 THEN 1000
                WHEN 16 THEN 2000 WHEN 17 THEN 1000 WHEN 18 THEN 10000
                WHEN 19 THEN 1000 WHEN 20 THEN 2500 WHEN 21 THEN 4000
                WHEN 22 THEN 1000 WHEN 23 THEN 1000 WHEN 24 THEN 2000
                WHEN 25 THEN 1000 WHEN 26 THEN 1000 WHEN 27 THEN 4000
                WHEN 28 THEN 6000 WHEN 29 THEN 1000
                ELSE 0
            END,
            coleccion = CASE
                WHEN Id_recompensa BETWEEN 1 AND 18 THEN 'V1'
                WHEN Id_recompensa BETWEEN 19 AND 29 THEN 'V2'
                WHEN Id_recompensa BETWEEN 1001 AND 1008 THEN 'HITO'
                ELSE coleccion
            END
            WHERE Id_recompensa BETWEEN 1 AND 29 OR Id_recompensa BETWEEN 1001 AND 1008
        `);

        await dbInstance.run(`
            UPDATE Perfil
            SET xp_acumulada = COALESCE(xp_acumulada, 0),
                nivel = MIN(CAST(COALESCE(xp_acumulada, 0) / 10000 AS INTEGER) + 1, 40)
        `);
        console.log("Catálogos de Íconos y Recompensas (V1, V2 e Hitos) verificados/actualizados.");

        return dbInstance;
    } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
        throw error;
    }
};

export const getDB = () => {
    if (!dbInstance) throw new Error("La BD no ha sido inicializada");
    return dbInstance;
};

export const ejecutarTransaccion = async <T>(
    operation: (db: Database) => Promise<T>
): Promise<T> => {
    const db = getDB();
    let liberarTurno!: () => void;
    const turnoActual = new Promise<void>((resolve) => {
        liberarTurno = resolve;
    });
    const turnoAnterior = transactionQueue;
    transactionQueue = turnoAnterior.then(() => turnoActual);
    await turnoAnterior;

    let transaccionActiva = false;
    try {
        await db.exec('BEGIN IMMEDIATE TRANSACTION');
        transaccionActiva = true;
        const resultado = await operation(db);
        await db.exec('COMMIT');
        transaccionActiva = false;
        return resultado;
    } catch (error) {
        if (transaccionActiva) {
            try {
                await db.exec('ROLLBACK');
            } catch (errorRollback) {
                console.error('No se pudo revertir la transacción de SQLite:', errorRollback);
            }
        }
        throw error;
    } finally {
        liberarTurno();
    }
};

export const cerrarBD = async (): Promise<void> => {
    if (dbInstance) {
        try {
            await dbInstance.close();
            dbInstance = null;
            console.log("🔴 Conexión a SQLite cerrada temporalmente para reemplazo.");
        } catch (error) {
            console.error("Error al intentar cerrar la base de datos:", error);
            throw error;
        }
    }
};