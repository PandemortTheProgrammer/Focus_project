// backend/src/services/PerfilManager.ts
import { ejecutarTransaccion, getDB } from '../config/db';
import * as xpManager from './xpManager'; // Importamos el motor de XP
import { evaluarNuevosLogros } from './RecompensasManager';
import type { ResultadoXP } from './xpManager';
import type { Database } from 'sqlite';

interface ValidacionRow {
    acumulador: number;
    datos_json: string;
}

const leerDatosValidacion = (datosJson: string | undefined): Record<string, unknown> => {
    if (!datosJson) return {};
    try {
        const datos: unknown = JSON.parse(datosJson);
        return typeof datos === 'object' && datos !== null && !Array.isArray(datos)
            ? datos as Record<string, unknown>
            : {};
    } catch {
        return {};
    }
};

const registrarEnfoqueProbado = async (
    db: Database,
    idPerfil: number,
    idEnfoque: number
): Promise<void> => {
    if (!Number.isSafeInteger(idEnfoque) || idEnfoque <= 0) {
        throw new Error('El ID del enfoque debe ser un entero positivo.');
    }

    const validacion = await db.get<ValidacionRow>(`
        SELECT acumulador, datos_json
        FROM Perfil_Validacion
        WHERE Id_perfil = ? AND evento = 'ENFOQUES_PROBADOS'
    `, [idPerfil]);
    const datos = leerDatosValidacion(validacion?.datos_json);
    const idsActuales = Array.isArray(datos.ids)
        ? datos.ids.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0)
        : [];
    const enfoqueNuevo = !idsActuales.includes(idEnfoque);
    const ids = [...new Set([...idsActuales, idEnfoque])];

    await db.run(`
        INSERT INTO Perfil_Validacion
            (Id_perfil, evento, acumulador, ultimo_registro, datos_json)
        VALUES (?, 'ENFOQUES_PROBADOS', ?, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(Id_perfil, evento) DO UPDATE SET
            acumulador = excluded.acumulador,
            ultimo_registro = CASE WHEN ? = 1
                THEN CURRENT_TIMESTAMP
                ELSE Perfil_Validacion.ultimo_registro
            END,
            datos_json = excluded.datos_json
    `, [idPerfil, ids.length, JSON.stringify({ ...datos, ids }), Number(enfoqueNuevo)]);
};

const registrarCambioEnfoque = async (
    db: Database,
    idPerfil: number
): Promise<void> => {
    await db.run(`
        INSERT INTO Perfil_Validacion
            (Id_perfil, evento, acumulador, ultimo_registro, datos_json)
        VALUES (?, 'CAMBIO_ENFOQUE', 1, CURRENT_TIMESTAMP, '{}')
        ON CONFLICT(Id_perfil, evento) DO UPDATE SET
            acumulador = Perfil_Validacion.acumulador + 1,
            ultimo_registro = CURRENT_TIMESTAMP
    `, [idPerfil]);
};

const combinarResultadoXP = (
    resultadoBase: ResultadoXP,
    resultadoLogros: ResultadoXP | null
): ResultadoXP => resultadoLogros
    ? {
        ...resultadoLogros,
        xpOtorgada: resultadoBase.xpOtorgada + resultadoLogros.xpOtorgada,
        subioNivel: resultadoBase.subioNivel || resultadoLogros.subioNivel,
        nivelesEscalados: resultadoBase.nivelesEscalados + resultadoLogros.nivelesEscalados,
        hitos: [...resultadoBase.hitos, ...resultadoLogros.hitos],
        logrosDesbloqueados: [
            ...resultadoBase.logrosDesbloqueados,
            ...resultadoLogros.logrosDesbloqueados
        ]
    }
    : resultadoBase;

export interface PerfilRow {
    Id_perfil: number;
    nickname: string;
    rango_edad: string;
    Id_enfoque: number | null;
    genero: string;
    Id_icono: number | null;
    pin: string | null;
    pista_pin?: string | null;
    nivel: number; // <-- Útil si el frontend quiere mostrar el nivel actual aquí
    xp_acumulada: number;
}

export const obtenerEnfoques = async (): Promise<{ id: number; nombre: string }[]> => {
    const db = getDB();
    return await db.all("SELECT * FROM Enfoque");
};

// --- NUEVO: Diccionario de recomendaciones estáticas para la V2 ---
const recomendacionesPorEnfoque: Record<number, string[]> = {
    1: [ // Académico
        "Prioriza al menos 2 horas diarias de estudio ininterrumpido (bloques de 45 mins).",
        "Limita el tiempo de 'Redes sociales' a menos de 1 hora diaria.",
        "Considera realizar 'Descanso activo' entre tus sesiones de estudio largo."
    ],
    2: [ // Tiempo libre
        "Tu objetivo es apilar tareas obligatorias en pocos bloques para liberar tus tardes.",
        "Asegúrate de registrar al menos una actividad de 'Ocio' o 'Hobby' al día.",
        "No superes las 8 horas laborales; desconecta por completo."
    ],
    3: [ // Atlético
        "Registra al menos 1 hora de 'Actividad física' diaria o interdiaria.",
        "Asegura tus 8 horas de 'Dormir' (Nivel 0) para recuperación muscular.",
        "Prioriza la 'Planificación de actividades' para preparar tus rutinas o comidas."
    ],
    4: [ // Económico
        "Prioriza tus horas en 'Trabajo' o 'Proyecto personal' de alto rendimiento.",
        "Agrupa tus 'Trámites' en un solo día para no fragmentar tu semana productiva.",
        "Cuidado con el 'Burnout': si superas las 50 horas semanales, a largo plazo podrías reducir tu rendimiento."
    ],
    5: [ // Salud mental y descanso
        "Tu prioridad no es hacer más, sino hacer mejor. Limita las actividades de estrés.",
        "Registra al menos 20 minutos de 'Meditación' o 'Autocuidado' diario.",
        "Asegúrate de tener un bloque de 'Socializar' o 'Familia' para tu bienestar emocional."
    ],
    6: [ // Flexibilidad
        "No te obsesiones con los bloques rígidos; permite que tu día varíe.",
        "Usa las actividades de 'Fondo' (música, podcast) para hacer amenas tus tareas.",
        "Si un día es improductivo, compénsalo suavemente al día siguiente sin culpas."
    ],
    7: [ // Equilibrado
        "Apunta a la regla de los tercios: 8h descanso, 8h trabajo/estudio, 8h ocio/rutina.",
        "Intenta que ningún tipo de actividad acapare más del 40% de tu semana.",
        "Mantén una mezcla saludable entre actividades prioritarias y de ocio menor."
    ]
};

export const obtenerDetallesEnfoque = async (idEnfoque: number) => {
    const db = getDB();
    const enfoqueDB = await db.get("SELECT Id_enfoque, nombre_enf, descrip_enf FROM Enfoque WHERE Id_enfoque = ?", [idEnfoque]);
    
    if (!enfoqueDB) return null;

    return {
        Id_enfoque: enfoqueDB.Id_enfoque,
        nombre_enf: enfoqueDB.nombre_enf,
        descripcion_larga: enfoqueDB.descrip_enf, 
        recomendaciones: recomendacionesPorEnfoque[idEnfoque] || [
            "Registra tus actividades constantemente para que el sistema te conozca mejor."
        ]
    };
};

export const actualizarPin = async (pin: string | null, pista_pin: string | null) => {
    const resultado = await ejecutarTransaccion(async (db) => {
        const perfilActual = await db.get("SELECT pin, pista_pin FROM Perfil WHERE Id_perfil = 1");
        if (!perfilActual) throw new Error("No se encontró el perfil para actualizar el PIN.");
        if (perfilActual.pin === pin && perfilActual.pista_pin === pista_pin) {
            return xpManager.procesarObtencionXPEnTransaccion(
                db,
                1,
                0,
                "Sin cambios en la configuración de seguridad"
            );
        }

        const primerPin = perfilActual.pin === null && pin !== null;
        const validacionPin = primerPin
            ? await db.get<{ acumulador: number }>(`
                SELECT acumulador
                FROM Perfil_Validacion
                WHERE Id_perfil = 1 AND evento = 'PIN_PRIMERA_VEZ'
            `)
            : null;
        const primeraConfiguracion = primerPin && Number(validacionPin?.acumulador ?? 0) === 0;
        const xpAOtorgar = primeraConfiguracion
            ? await xpManager.obtenerXpFaltanteParaNivel(1)
            : 70;

        await db.run(
            'UPDATE Perfil SET pin = ?, pista_pin = ? WHERE Id_perfil = 1',
            [pin, pista_pin]
        );

        if (primeraConfiguracion) {
            await db.run(`
                INSERT INTO Perfil_Validacion
                    (Id_perfil, evento, acumulador, ultimo_registro, datos_json)
                VALUES (1, 'PIN_PRIMERA_VEZ', 1, CURRENT_TIMESTAMP, '{}')
                ON CONFLICT(Id_perfil, evento) DO UPDATE SET
                    acumulador = MAX(1, Perfil_Validacion.acumulador),
                    ultimo_registro = CURRENT_TIMESTAMP
            `);
        }

        const resultado = await xpManager.procesarObtencionXPEnTransaccion(
            db,
            1,
            xpAOtorgar,
            primeraConfiguracion ? "Configuración inicial de PIN" : "Modificación de PIN o palabra clave"
        );
        return resultado;
    });
    const resultadoLogros = await evaluarNuevosLogros(1);
    return {
        resultadoXP: combinarResultadoXP(resultado, resultadoLogros.resultadoXP),
        logrosDesbloqueados: resultadoLogros.logrosDesbloqueados
    };
};

export const guardarPerfil = async (datos: { nickname: string; age_rank: string; genero: string; id_focus: string | number; id_icono?: number | null }) => {
    const db = getDB();
    const idIcono = typeof datos.id_icono === 'number' && datos.id_icono > 0 ? datos.id_icono : 1;
    const idEnfoque = Number(datos.id_focus);
    if (!Number.isSafeInteger(idEnfoque) || idEnfoque <= 0) {
        throw new Error('El ID del enfoque debe ser un entero positivo.');
    }
    const perfilExistente = await db.get<{ Id_perfil: number; Id_enfoque: number | null }>(
        'SELECT Id_perfil, Id_enfoque FROM Perfil WHERE Id_perfil = 1'
    );

    if (perfilExistente) {
        await ejecutarTransaccion(async (dbTransaccion) => {
            const enfoqueAnterior = perfilExistente.Id_enfoque === null
                ? null
                : Number(perfilExistente.Id_enfoque);
            await dbTransaccion.run(`
                UPDATE Perfil
                SET nickname = ?, rango_edad = ?, Id_enfoque = ?, genero = ?, Id_icono = ?
                WHERE Id_perfil = 1
            `, [datos.nickname, datos.age_rank, idEnfoque, datos.genero, idIcono]);

            if (enfoqueAnterior !== idEnfoque) {
                if (enfoqueAnterior !== null) {
                    await registrarEnfoqueProbado(dbTransaccion, 1, enfoqueAnterior);
                    await registrarCambioEnfoque(dbTransaccion, 1);
                }
                await registrarEnfoqueProbado(dbTransaccion, 1, idEnfoque);
            }
        });
        console.log("👤 Perfil actualizado con éxito (Recompensas a salvo)")

        // Retornamos el objeto XP por la edición del perfil
        return await xpManager.procesarObtencionXP(1, 20, "Edición de perfil");
    } else {
        const queryInsert = `
            INSERT INTO Perfil (Id_perfil, nickname, rango_edad, Id_enfoque, genero, Id_icono)
            VALUES (1, ?, ?, ?, ?, ?)
        `;
        await ejecutarTransaccion(async (dbTransaccion) => {
            await dbTransaccion.run(queryInsert, [
                datos.nickname,
                datos.age_rank,
                idEnfoque,
                datos.genero,
                idIcono,
            ]);
            await registrarEnfoqueProbado(dbTransaccion, 1, idEnfoque);
        });
        console.log("👤 Perfil nuevo guardado con éxito en la tabla SQLite")

        // Creación inicial no otorga XP de "edición"
        return { xpOtorgada: 0, subioNivel: false };
    }
};

export const obtenerPerfil = async (): Promise<PerfilRow | null> => {
    const db = getDB();
    const query = `SELECT * FROM Perfil LIMIT 1`;
    const perfil = await db.get<PerfilRow>(query);
    return perfil ?? null;
};

export const reiniciarPerfilYDatos = async (): Promise<void> => {
    await ejecutarTransaccion(async (dbTransaccion) => {
        await dbTransaccion.run('DELETE FROM Perfil_Recompensa');
        await dbTransaccion.run('DELETE FROM Reporte_semanal');
        await dbTransaccion.run('DELETE FROM Actividad');
        await dbTransaccion.run('DELETE FROM Perfil');
        await dbTransaccion.run('DELETE FROM sqlite_sequence WHERE name IN ("Actividad", "Reporte_semanal")');
        console.log("🧹 Base de datos reiniciada con éxito. Lista para un nuevo perfil.");
    }).catch((error) => {
        console.error("Error al reiniciar la base de datos:", error);
        throw error;
    });
};

export const actualizarEnfoque = async (idEnfoque: number) => {
    const db = getDB();

    const cambioRealizado = await ejecutarTransaccion(async (dbTransaccion) => {
        const perfil = await dbTransaccion.get<{ Id_enfoque: number | null }>(
            'SELECT Id_enfoque FROM Perfil WHERE Id_perfil = 1'
        );
        if (!perfil) throw new Error('No se encontró el perfil para cambiar el enfoque.');

        const enfoqueActual = perfil.Id_enfoque === null ? null : Number(perfil.Id_enfoque);
        if (enfoqueActual !== null) {
            await registrarEnfoqueProbado(dbTransaccion, 1, enfoqueActual);
        }

        if (enfoqueActual === idEnfoque) return false;

        await registrarCambioEnfoque(dbTransaccion, 1);
        await registrarEnfoqueProbado(dbTransaccion, 1, idEnfoque);
        await dbTransaccion.run(
            'UPDATE Perfil SET Id_enfoque = ? WHERE Id_perfil = 1',
            [idEnfoque]
        );
        return true;
    });

    // Verificamos en el historial de reportes semanales cuántos enfoques distintos ha usado
    const historialEnfoques = await db.get("SELECT COUNT(DISTINCT Id_enfoque) as total FROM Reporte_semanal");
    const esPrimerCambio = historialEnfoques.total <= 1;
    const xpAOtorgar = cambioRealizado ? (esPrimerCambio ? 2000 : 100) : 0;

    const resultadoXP = await xpManager.procesarObtencionXP(
        1,
        xpAOtorgar,
        cambioRealizado ? "Cambio de Enfoque" : "Enfoque sin cambios"
    );
    const resultadoLogros = await evaluarNuevosLogros(1);

    return {
        resultadoXP: combinarResultadoXP(resultadoXP, resultadoLogros.resultadoXP),
        logrosDesbloqueados: resultadoLogros.logrosDesbloqueados
    };
};