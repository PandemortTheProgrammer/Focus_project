// backend/src/services/recompensasManager.ts
import { getDB } from '../config/db';
import Recompensa from '../models/Recompensa';
import Icono from '../models/Icono';
import Recompensa_perfil from '../models/Recompensa_perfil';
import * as xpManager from './xpManager';

interface RecompensaRow {
    Id_recompensa?: number;
    nombre_recompensa?: string;
    descripcion?: string;
    tipo_recompensa?: string;
    coleccion?: string | null;
    Id_desbloqueado?: number | null;
    Id_icono?: number | null;
    nombre_icono?: string;
    nombre_desbloqueado?: string | null;
    xp_otorgada?: number | null;
};

interface CatalogoRecompensaRow extends RecompensaRow {
    estaDesbloqueado?: number;
    fecha_obtencion?: string | null;
}

interface PerfilRecompensaRow {
    Id_perfil?: number;
    Id_recompensa?: number;
    fecha_obtencion?: string | null;
}

interface ConteoRow {
    total?: number;
}

interface SumaMinutosRow {
    totalMinutos?: number | null;
}

interface EnfoquesProbadosRow {
    acumulador: number;
    datos_json: string;
}

const obtenerIdsEnfoquesProbados = (datosJson: string | undefined): number[] => {
    if (!datosJson) return [];
    try {
        const datos: unknown = JSON.parse(datosJson);
        if (typeof datos !== 'object' || datos === null || !('ids' in datos) || !Array.isArray(datos.ids)) {
            return [];
        }
        return [...new Set(datos.ids
            .map(Number)
            .filter((id) => Number.isSafeInteger(id) && id > 0))];
    } catch {
        return [];
    }
};

const mapRowToRecompensa = (row: RecompensaRow): Recompensa => {
    return new Recompensa(
        Number(row.Id_recompensa ?? 0),
        String(row.nombre_recompensa ?? ''),
        String(row.descripcion ?? ''),
        String(row.tipo_recompensa ?? 'ICONO'),
        row.Id_desbloqueado ?? row.Id_icono ?? undefined
    );
};

const mapRowToIcono = (row: RecompensaRow): Icono => {
    return new Icono(
        Number(row.Id_icono ?? 0),
        String(row.nombre_icono ?? '')
    );
};

export const obtenerCatalogoIconos = async (): Promise<Icono[]> => {
    const db = getDB();
    const filas: RecompensaRow[] = await db.all(
        `SELECT Id_icono, nombre_icono FROM Icono ORDER BY Id_icono ASC`
    );

    return filas.map((fila) => new Icono(
        Number(fila.Id_icono ?? 0),
        String(fila.nombre_icono ?? '')
    ));
};

const mapRowToPerfilRecompensa = (row: PerfilRecompensaRow): Recompensa_perfil => {
    return new Recompensa_perfil(
        Number(row.Id_perfil ?? 0),
        Number(row.Id_recompensa ?? 0),
        row.fecha_obtencion ? new Date(row.fecha_obtencion) : new Date()
    );
};

export const obtenerRecompensasDePerfil = async (idPerfil: number) => {
    const db = getDB();
    const query = `
        SELECT r.Id_recompensa, r.nombre_recompensa, r.descripcion, r.tipo_recompensa, r.Id_desbloqueado, i.Id_icono,
            COALESCE(i.nombre_icono, t.nombre_tarjeta) AS nombre_icono,
            COALESCE(i.nombre_icono, t.nombre_tarjeta) AS nombre_desbloqueado
        FROM Recompensa r
        JOIN Perfil_Recompensa pr ON r.Id_recompensa = pr.Id_recompensa
        LEFT JOIN Icono i ON r.tipo_recompensa = 'ICONO' AND r.Id_desbloqueado = i.Id_icono
        LEFT JOIN Tarjeta t ON r.tipo_recompensa IN ('FONDO', 'MEDALLON', 'CARD') AND r.Id_desbloqueado = t.Id_tarjeta
        WHERE pr.Id_perfil = ?
    `;

    const filas: RecompensaRow[] = await db.all(query, [idPerfil]);
    
    return filas.map(row => ({
        Id_recompensa: Number(row.Id_recompensa ?? 0),
        nombre_recompensa: String(row.nombre_recompensa ?? ''),
        descripcion: String(row.descripcion ?? ''),
        tipo_recompensa: String(row.tipo_recompensa ?? 'ICONO'),
        Id_desbloqueado: row.Id_desbloqueado,
        Id_icono: row.Id_icono,
        nombre_icono: String(row.nombre_icono ?? 'Ícono Especial'),
        nombre_desbloqueado: row.nombre_desbloqueado ?? null
    }));
};

export const obtenerCatalogoRecompensasConEstado = async (idPerfil: number) => {
    const db = getDB();
    
    // El CASE evalúa si existe un registro en Perfil_Recompensa para este usuario.
    // Si existe (IS NOT NULL), devuelve 1 (true). Si no, 0 (false).
    const query = `
        SELECT 
            r.Id_recompensa, 
            r.nombre_recompensa, 
            r.descripcion, 
            r.tipo_recompensa, 
            r.coleccion,
            r.Id_desbloqueado,
            i.Id_icono, 
            COALESCE(i.nombre_icono, t.nombre_tarjeta) AS nombre_icono,
            COALESCE(i.nombre_icono, t.nombre_tarjeta) AS nombre_desbloqueado,
            CASE WHEN pr.Id_perfil IS NOT NULL THEN 1 ELSE 0 END as estaDesbloqueado,
            pr.fecha_obtencion
        FROM Recompensa r
        LEFT JOIN Icono i ON r.tipo_recompensa = 'ICONO' AND r.Id_desbloqueado = i.Id_icono
        LEFT JOIN Tarjeta t ON r.tipo_recompensa IN ('FONDO', 'MEDALLON', 'CARD') AND r.Id_desbloqueado = t.Id_tarjeta
        LEFT JOIN Perfil_Recompensa pr ON r.Id_recompensa = pr.Id_recompensa AND pr.Id_perfil = ?
        ORDER BY r.Id_recompensa ASC
    `;

    const filas: CatalogoRecompensaRow[] = await db.all(query, [idPerfil]);
    
    return filas.map(row => ({
        Id_recompensa: Number(row.Id_recompensa ?? 0),
        nombre_recompensa: String(row.nombre_recompensa ?? ''),
        descripcion: String(row.descripcion ?? ''),
        tipo_recompensa: String(row.tipo_recompensa ?? 'ICONO'),
        coleccion: row.coleccion ?? undefined,
        Id_desbloqueado: row.Id_desbloqueado,
        Id_icono: row.Id_icono,
        nombre_icono: String(row.nombre_icono ?? ''),
        nombre_desbloqueado: row.nombre_desbloqueado ?? null,
        estaDesbloqueado: Boolean(row.estaDesbloqueado),
        fecha_obtencion: row.fecha_obtencion ?? undefined
    }));
};


let colaEvaluacionLogros: Promise<void> = Promise.resolve();

// 2. El motor de evaluación actualizado con parámetro opcional 'eventoEspecial'
const evaluarNuevosLogrosInterno = async (
    idPerfil: number,
    eventoEspecial?: string,
    xpAdicional = 0,
    motivoXPAdicional = 'Acción completada',
    soloLogrosV2Consultables = false
) => {
    const db = getDB();
    const nuevosLogrosIds: number[] = [];

    const obtenidas = await db.all(
        `SELECT Id_recompensa FROM Perfil_Recompensa WHERE Id_perfil = ?`,
        [idPerfil]
    );
    const idsObtenidas = new Set(obtenidas.map((fila) => Number(fila.Id_recompensa)));

    if (!soloLogrosV2Consultables) {
    // --- REGLAS 1 a 12 (Se mantienen exactamente igual) ---
    if (!idsObtenidas.has(1)) {
        await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 1]);
        nuevosLogrosIds.push(1);
    }
    if (!idsObtenidas.has(2)) {
        const conteo = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteo?.total ?? 0) >= 1) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 2]);
            nuevosLogrosIds.push(2);
        }
    }
    if (!idsObtenidas.has(3)) {
        const horas = await db.get(`SELECT SUM(durac_min) as totalMinutos FROM Actividad`);
        if ((horas?.totalMinutos ?? 0) >= 600) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 3]);
            nuevosLogrosIds.push(3);
        }
    }
    if (!idsObtenidas.has(4) || !idsObtenidas.has(5) || !idsObtenidas.has(13)) {
        const reportes = await db.get(`SELECT COUNT(*) as total FROM Reporte_semanal`);
        const totalReportes = reportes?.total ?? 0;
        if (!idsObtenidas.has(4) && totalReportes >= 1) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 4]);
            nuevosLogrosIds.push(4);
        }
        if (!idsObtenidas.has(5) && totalReportes >= 2) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 5]);
            nuevosLogrosIds.push(5);
        }
        if (!idsObtenidas.has(13) && totalReportes >= 4) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 13]);
            nuevosLogrosIds.push(13);
        }
    }
    if (!idsObtenidas.has(7) && eventoEspecial === 'DESCARGA_PERFIL') {
        await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 7]);
        nuevosLogrosIds.push(7);
    }
    if (!idsObtenidas.has(8)) {
        const conteo = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteo?.total ?? 0) >= 50) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 8]);
            nuevosLogrosIds.push(8);
        }
    }
    if (!idsObtenidas.has(9)) {
        const nocturna = await db.get(`SELECT 1 FROM Actividad WHERE hora_inicio >= '00:00' AND hora_inicio <= '04:00' LIMIT 1`);
        if (nocturna) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 9]);
            nuevosLogrosIds.push(9);
        }
    }
    if (!idsObtenidas.has(10) && eventoEspecial === 'VISITA_PROGRESO') {
        await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 10]);
        nuevosLogrosIds.push(10);
    }
    if (!idsObtenidas.has(11)) {
        const cruzadoTipos = await db.get(`
            SELECT
                (SELECT COUNT(DISTINCT Id_tipo) FROM Actividad) as tiposUsados,
                (SELECT COUNT(Id_tipo) FROM Tipo_actividad) as tiposTotales
        `);
        if (cruzadoTipos && cruzadoTipos.tiposTotales > 0 && cruzadoTipos.tiposUsados >= cruzadoTipos.tiposTotales) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 11]);
            nuevosLogrosIds.push(11);
        }
    }
    if (!idsObtenidas.has(12) && eventoEspecial === 'EDICION_PERFIL') {
        await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 12]);
        nuevosLogrosIds.push(12);
    }

    // --- NUEVAS REGLAS (14 a 18) ---

    // REGLA 14: ¿Ha pasado un año?
    if (!idsObtenidas.has(14)) {
        try {
            // Busca la fecha más antigua en los registros de actividades
            const primeraActividad = await db.get(`SELECT MIN(fecha) as fechaInicio FROM Actividad`);
            if (primeraActividad && primeraActividad.fechaInicio) {
                const fechaInicio = new Date(primeraActividad.fechaInicio);
                const hoy = new Date();
                
                const diffTime = hoy.getTime() - fechaInicio.getTime();
                if (diffTime >= 365 * 24 * 60 * 60 * 1000) {
                    await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 14]);
                    nuevosLogrosIds.push(14);
                }
            }
        } catch (error) {
            console.error("Error al calcular el año de uso:", error);
        }
    }

    // REGLA 15: Madrugador
    if (!idsObtenidas.has(15)) {
        const madrugador = await db.get(`
            SELECT 1 FROM Actividad 
            WHERE hora_inicio > '04:00' AND hora_inicio <= '07:59' 
            LIMIT 1
        `);
        if (madrugador) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 15]);
            nuevosLogrosIds.push(15);
        }
    }

    // REGLA 16: Un nuevo comienzo
    if (!idsObtenidas.has(16) && eventoEspecial === 'REPORTE_NUEVO_ENFOQUE') {
        await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 16]);
        nuevosLogrosIds.push(16);
    }

    // REGLA 17: Recordando viejos tiempos
    if (!idsObtenidas.has(17) && eventoEspecial === 'VISITA_HISTORIAL') {
        await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 17]);
        nuevosLogrosIds.push(17);
    }

    // "Coleccionista" se obtiene al completar todos los hitos V1 marcados como exploración.
    if (!idsObtenidas.has(6)) {
        const hitosExploracionV1 = [1, 2, 4, 7, 9, 10, 12, 15, 17];
        const logrosActuales = new Set([...idsObtenidas, ...nuevosLogrosIds]);
        if (hitosExploracionV1.every((idRecompensa) => logrosActuales.has(idRecompensa))) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 6]);
            nuevosLogrosIds.push(6);
        }
    }

    // REGLA 18: Gran Maestro (Debe ir al final de todas las reglas)
    if (!idsObtenidas.has(18)) {
        // Unimos los logros que ya tenía con los que acaba de ganar en esta misma evaluación
        const todosLosLogrosActuales = new Set([...idsObtenidas, ...nuevosLogrosIds]);
        
        let tieneTodos = true;
        for (let i = 1; i <= 17; i++) {
            if (!todosLosLogrosActuales.has(i)) {
                tieneTodos = false;
                break;
            }
        }

        if (tieneTodos) {
            await db.run(`INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 18]);
            nuevosLogrosIds.push(18);
        }
    }
    }

    // Logros V2 que pueden validarse con datos persistentes.
    if (!idsObtenidas.has(19) || !idsObtenidas.has(20)) {
        const plantillas = await db.get<{ total: number }>(
            'SELECT COUNT(*) AS total FROM Plantilla_Actividad'
        );
        const totalPlantillas = Number(plantillas?.total ?? 0);
        if (!idsObtenidas.has(19) && totalPlantillas >= 1) {
            await db.run(
                'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
                [idPerfil, 19]
            );
            nuevosLogrosIds.push(19);
        }
        if (!idsObtenidas.has(20) && totalPlantillas >= 10) {
            await db.run(
                'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
                [idPerfil, 20]
            );
            nuevosLogrosIds.push(20);
        }
    }

    if (!idsObtenidas.has(22) || !idsObtenidas.has(23)) {
        const seguridad = await db.get<{ pin: string | null; pista_pin: string | null }>(
            'SELECT pin, pista_pin FROM Perfil WHERE Id_perfil = ?',
            [idPerfil]
        );
        if (!idsObtenidas.has(22) && seguridad?.pin) {
            await db.run(
                'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
                [idPerfil, 22]
            );
            nuevosLogrosIds.push(22);
        }
        if (!idsObtenidas.has(23) && seguridad?.pista_pin?.trim()) {
            await db.run(
                'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
                [idPerfil, 23]
            );
            nuevosLogrosIds.push(23);
        }
    }

    if (!idsObtenidas.has(24) && eventoEspecial === 'PLANTILLA_ACTIVIDAD_ANTIGUA') {
        await db.run(
            'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
            [idPerfil, 24]
        );
        nuevosLogrosIds.push(24);
    }
    if (!idsObtenidas.has(21) && eventoEspecial === 'DIEZ_ACTIVIDADES_EN_FORMULARIO') {
        await db.run(
            'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
            [idPerfil, 21]
        );
        nuevosLogrosIds.push(21);
    }
    if (!idsObtenidas.has(25) && eventoEspecial === 'VISITA_PLANTILLAS') {
        await db.run(
            'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
            [idPerfil, 25]
        );
        nuevosLogrosIds.push(25);
    }
    if (!idsObtenidas.has(26) && eventoEspecial === 'VISITA_DETALLES_ENFOQUE') {
        await db.run(
            'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
            [idPerfil, 26]
        );
        nuevosLogrosIds.push(26);
    }
    if (!idsObtenidas.has(27)) {
        const enfoquesProbados = await db.get<EnfoquesProbadosRow>(`
            SELECT acumulador, datos_json
            FROM Perfil_Validacion
            WHERE Id_perfil = ? AND evento = 'ENFOQUES_PROBADOS'
        `, [idPerfil]);
        const idsProbados = obtenerIdsEnfoquesProbados(enfoquesProbados?.datos_json);
        const enfoqueActual = await db.get<{ Id_enfoque: number | null }>(
            'SELECT Id_enfoque FROM Perfil WHERE Id_perfil = ?',
            [idPerfil]
        );
        if (enfoqueActual?.Id_enfoque) idsProbados.push(Number(enfoqueActual.Id_enfoque));
        const cantidadEnfoquesProbados = new Set(idsProbados).size;
        const enfoquesTotales = await db.get<{ total: number }>(
            'SELECT COUNT(*) AS total FROM Enfoque'
        );
        if (Number(enfoquesTotales?.total ?? 0) > 0 &&
            cantidadEnfoquesProbados >= Number(enfoquesTotales?.total ?? 0)) {
            await db.run(
                'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
                [idPerfil, 27]
            );
            nuevosLogrosIds.push(27);
        }
    }
    if (!idsObtenidas.has(28)) {
        const enfoquesSinReporte = await db.get<{ total: number }>(`
            SELECT COUNT(*) AS total
            FROM Enfoque e
            WHERE NOT EXISTS (
                SELECT 1 FROM Reporte_semanal rs
                WHERE rs.Id_enfoque = e.Id_enfoque
            )
        `);
        const enfoquesTotales = await db.get<{ total: number }>(
            'SELECT COUNT(*) AS total FROM Enfoque'
        );
        if (Number(enfoquesTotales?.total ?? 0) > 0 &&
            Number(enfoquesSinReporte?.total ?? 0) === 0) {
            await db.run(
                'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
                [idPerfil, 28]
            );
            nuevosLogrosIds.push(28);
        }
    }
    if (!idsObtenidas.has(29) && eventoEspecial === 'VISITA_PROGRESO') {
        await db.run(
            'INSERT OR IGNORE INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)',
            [idPerfil, 29]
        );
        nuevosLogrosIds.push(29);
    }

    const sincronizacionXP = await xpManager.procesarXPLogrosPendientes(
        idPerfil,
        xpAdicional,
        motivoXPAdicional
    );
    const logrosDesbloqueados = nuevosLogrosIds.length === 0
        ? []
        : await db.all(`
            SELECT r.Id_recompensa, r.nombre_recompensa, r.descripcion, r.tipo_recompensa,
                r.Id_desbloqueado, r.coleccion, r.xp_otorgada, i.Id_icono,
                COALESCE(i.nombre_icono, t.nombre_tarjeta) AS nombre_icono,
                COALESCE(i.nombre_icono, t.nombre_tarjeta) AS nombre_desbloqueado
            FROM Recompensa r
            LEFT JOIN Icono i ON r.tipo_recompensa = 'ICONO' AND r.Id_desbloqueado = i.Id_icono
            LEFT JOIN Tarjeta t ON r.tipo_recompensa IN ('FONDO', 'MEDALLON', 'CARD') AND r.Id_desbloqueado = t.Id_tarjeta
            WHERE r.Id_recompensa IN (${nuevosLogrosIds.map(() => '?').join(',')})
            ORDER BY r.Id_recompensa
        `, nuevosLogrosIds);

    return {
        logrosDesbloqueados: logrosDesbloqueados.map((row: RecompensaRow) => ({
        Id_recompensa: Number(row.Id_recompensa ?? 0),
        nombre_recompensa: String(row.nombre_recompensa ?? ''),
        descripcion: String(row.descripcion ?? ''),
        tipo_recompensa: String(row.tipo_recompensa ?? 'ICONO'),
        Id_desbloqueado: row.Id_desbloqueado,
        Id_icono: row.Id_icono,
        nombre_icono: String(row.nombre_icono ?? ''),
        nombre_desbloqueado: row.nombre_desbloqueado ?? null,
        coleccion: String(row.coleccion ?? 'V1'), // <-- Nuevo
        xp_otorgada: Number(row.xp_otorgada ?? 0) // <-- Nuevo
        })),
        resultadoXP: sincronizacionXP.resultadoXP
    };
};

export const evaluarNuevosLogros = (
    idPerfil: number,
    eventoEspecial?: string,
    xpAdicional = 0,
    motivoXPAdicional = 'Acción completada',
    soloLogrosV2Consultables = false
) => {
    const resultado = colaEvaluacionLogros.then(() =>
        evaluarNuevosLogrosInterno(
            idPerfil,
            eventoEspecial,
            xpAdicional,
            motivoXPAdicional,
            soloLogrosV2Consultables
        )
    );
    colaEvaluacionLogros = resultado.then(() => undefined, () => undefined);
    return resultado;
};

export const obtenerIconosDesbloqueados = async (idPerfil: number): Promise<Icono[]> => {
    const db = getDB();
    const query = `
        SELECT i.Id_icono, i.nombre_icono
        FROM Recompensa r
        JOIN Perfil_Recompensa pr ON r.Id_recompensa = pr.Id_recompensa
        JOIN Icono i ON r.Id_desbloqueado = i.Id_icono
        WHERE pr.Id_perfil = ? AND r.tipo_recompensa = 'ICONO'
    `;

    const filas: RecompensaRow[] = await db.all(query, [idPerfil]);
    return filas.map(mapRowToIcono);
};

export const obtenerRelacionesPerfilRecompensa = async (idPerfil: number): Promise<Recompensa_perfil[]> => {
    const db = getDB();
    const query = `
        SELECT Id_perfil, Id_recompensa, fecha_obtencion
        FROM Perfil_Recompensa
        WHERE Id_perfil = ?
        ORDER BY fecha_obtencion DESC
    `;

    const filas: PerfilRecompensaRow[] = await db.all(query, [idPerfil]);
    return filas.map(mapRowToPerfilRecompensa);
};