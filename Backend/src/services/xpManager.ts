import { ejecutarTransaccion, getDB } from '../config/db';
import type { Database } from 'sqlite';
import { obtenerSemanaLocalDeTimestamp } from '../utils/fechas';

const XP_POR_NIVEL = 10000;
const NIVEL_MAXIMO = 40;

export interface ResultadoXP {
    xpOtorgada: number;
    xpTotal: number;
    nivelActual: number;
    subioNivel: boolean;
    nivelesEscalados: number;
    hitos: number[];
    logrosDesbloqueados: {
        Id_recompensa: number;
        nombre_recompensa: string;
        descripcion: string;
        tipo_recompensa: string;
        coleccion: string;
        Id_desbloqueado: number;
        nombre_icono: string;
    }[];
}

interface RecompensaXPRow {
    Id_recompensa: number;
    xp_base: number | null;
}

interface ValidacionRow {
    acumulador: number;
    ultimo_registro: string | null;
    datos_json: string;
}

const leerObjetoValidacion = (datosJson: string): Record<string, unknown> => {
    try {
        const datos: unknown = JSON.parse(datosJson);
        return typeof datos === 'object' && datos !== null && !Array.isArray(datos)
            ? datos as Record<string, unknown>
            : {};
    } catch {
        return {};
    }
};

const leerClavesValidacion = (datos: Record<string, unknown>): string[] =>
    Array.isArray(datos.claves)
        ? [...new Set(datos.claves.filter((clave): clave is string => typeof clave === 'string'))]
        : [];

export const procesarObtencionXPEnTransaccion = async (
    db: Database,
    idPerfil: number,
    cantidadXP: number,
    motivo: string
): Promise<ResultadoXP> => {
    if (!Number.isSafeInteger(cantidadXP) || cantidadXP < 0) {
        throw new Error('La cantidad de XP debe ser un entero no negativo.');
    }

    const perfil = await db.get(
        'SELECT xp_acumulada, nivel FROM Perfil WHERE Id_perfil = ?',
        [idPerfil]
    );
    if (!perfil) throw new Error('Perfil no encontrado');

    const xpAnterior = Number(perfil.xp_acumulada ?? 0);
    const nivelAnterior = Number(perfil.nivel ?? 1);
    let nuevaXpAcumulada = xpAnterior + cantidadXP;
    let nivelCalculado = Math.min(
        Math.floor(nuevaXpAcumulada / XP_POR_NIVEL) + 1,
        NIVEL_MAXIMO
    );
    const logrosDesbloqueados: ResultadoXP['logrosDesbloqueados'] = [];

    while (nivelCalculado >= 5) {
        const hitosPendientes = await db.all<{
            Id_recompensa: number;
            nombre_recompensa: string;
            descripcion: string;
            tipo_recompensa: string;
            coleccion: string;
            Id_desbloqueado: number;
            xp_otorgada: number | null;
            nombre_tarjeta: string;
        }[]>(`
            SELECT r.Id_recompensa, r.nombre_recompensa, r.descripcion,
                r.tipo_recompensa, r.coleccion, r.Id_desbloqueado,
                r.xp_otorgada, t.nombre_tarjeta
            FROM Recompensa r
            JOIN Tarjeta t ON t.Id_tarjeta = r.Id_desbloqueado
            LEFT JOIN Perfil_Recompensa pr
                ON pr.Id_perfil = ? AND pr.Id_recompensa = r.Id_recompensa
            WHERE r.coleccion = 'HITO'
                AND r.tipo_recompensa = 'CARD'
                AND (r.Id_desbloqueado - 1) * 5 <= ?
                AND pr.Id_recompensa IS NULL
            ORDER BY r.Id_desbloqueado
        `, [idPerfil, nivelCalculado]);

        if (hitosPendientes.length === 0) break;

        for (const hito of hitosPendientes) {
            const xpHito = 1000 + Number(hito.xp_otorgada ?? 0);
            const otorgamiento = await db.run(
                `INSERT OR IGNORE INTO Perfil_Recompensa
                    (Id_perfil, Id_recompensa, xp_procesada)
                 VALUES (?, ?, 1)`,
                [idPerfil, hito.Id_recompensa]
            );
            if (otorgamiento.changes === 0) continue;

            nuevaXpAcumulada += xpHito;
            logrosDesbloqueados.push({
                Id_recompensa: hito.Id_recompensa,
                nombre_recompensa: hito.nombre_recompensa,
                descripcion: hito.descripcion,
                tipo_recompensa: hito.tipo_recompensa,
                coleccion: hito.coleccion,
                Id_desbloqueado: hito.Id_desbloqueado,
                nombre_icono: hito.nombre_tarjeta
            });
        }
        nivelCalculado = Math.min(
            Math.floor(nuevaXpAcumulada / XP_POR_NIVEL) + 1,
            NIVEL_MAXIMO
        );
    }

    const nuevoNivelReal = Math.max(nivelAnterior, nivelCalculado);
    const subioNivel = nuevoNivelReal > nivelAnterior;
    const hitosAlcanzados = logrosDesbloqueados
        .map((hito) => (hito.Id_desbloqueado - 1) * 5);

    await db.run(
        'UPDATE Perfil SET xp_acumulada = ?, nivel = ? WHERE Id_perfil = ?',
        [nuevaXpAcumulada, nuevoNivelReal, idPerfil]
    );

    console.log(`[XP] +${nuevaXpAcumulada - xpAnterior} XP a Perfil ${idPerfil} por: ${motivo}`);

    return {
        xpOtorgada: nuevaXpAcumulada - xpAnterior,
        xpTotal: nuevaXpAcumulada,
        nivelActual: nuevoNivelReal,
        subioNivel,
        nivelesEscalados: subioNivel ? nuevoNivelReal - nivelAnterior : 0,
        hitos: hitosAlcanzados,
        logrosDesbloqueados
    };
};

export const procesarObtencionXP = async (
    idPerfil: number,
    cantidadXP: number,
    motivo: string
): Promise<ResultadoXP> => ejecutarTransaccion((db) =>
    procesarObtencionXPEnTransaccion(db, idPerfil, cantidadXP, motivo)
);

export const otorgarXPEventoUnico = async (
    idPerfil: number,
    evento: string,
    claveEvento: string,
    cantidadXP: number,
    motivo: string
): Promise<ResultadoXP | null> => {
    if (!Number.isSafeInteger(cantidadXP) || cantidadXP < 0) {
        throw new Error('La cantidad de XP debe ser un entero no negativo.');
    }

    return ejecutarTransaccion(async (db) => {
        const validacion = await db.get<ValidacionRow>(`
            SELECT acumulador, ultimo_registro, datos_json
            FROM Perfil_Validacion
            WHERE Id_perfil = ? AND evento = ?
        `, [idPerfil, evento]);
        const datos = leerObjetoValidacion(validacion?.datos_json ?? '{}');
        const claves = leerClavesValidacion(datos);
        const eventoSemanal = evento === 'VISITA_MI_PROGRESO';
        if (eventoSemanal
            ? obtenerSemanaLocalDeTimestamp(validacion?.ultimo_registro ?? '') === claveEvento
            : claves.includes(claveEvento)) {
            return null;
        }

        await db.run(`
            INSERT INTO Perfil_Validacion
                (Id_perfil, evento, acumulador, ultimo_registro, datos_json)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)
            ON CONFLICT(Id_perfil, evento) DO UPDATE SET
                acumulador = Perfil_Validacion.acumulador + 1,
                ultimo_registro = CURRENT_TIMESTAMP,
                datos_json = excluded.datos_json
        `, [
            idPerfil,
            evento,
            JSON.stringify(eventoSemanal
                ? datos
                : { ...datos, claves: [...claves, claveEvento] })
        ]);

        return cantidadXP > 0
            ? await procesarObtencionXPEnTransaccion(db, idPerfil, cantidadXP, motivo)
            : null;
    });
};

export const procesarXPLogrosPendientes = async (
    idPerfil: number,
    xpAdicional = 0,
    motivoAdicional = 'Logros obtenidos'
): Promise<{ resultadoXP: ResultadoXP | null; logrosConXP: number[] }> => {
    if (!Number.isSafeInteger(xpAdicional) || xpAdicional < 0) {
        throw new Error('La cantidad adicional de XP debe ser un entero no negativo.');
    }

    return ejecutarTransaccion(async (db) => {
        const pendientes: RecompensaXPRow[] = await db.all(`
            SELECT pr.Id_recompensa, COALESCE(r.xp_otorgada, 0) AS xp_base
            FROM Perfil_Recompensa pr
            JOIN Recompensa r ON r.Id_recompensa = pr.Id_recompensa
            WHERE pr.Id_perfil = ? AND pr.xp_procesada = 0
            ORDER BY pr.Id_recompensa
        `, [idPerfil]);

        const xpDeLogros = pendientes.reduce((total, recompensa) => {
            const xpBase = Number(recompensa.xp_base ?? 0);
            if (!Number.isSafeInteger(xpBase) || xpBase < 0) {
                throw new Error(`XP inválida configurada para el logro ${recompensa.Id_recompensa}.`);
            }
            return total + 1000 + xpBase;
        }, 0);
        const xpTotal = xpDeLogros + xpAdicional;

        let resultadoXP: ResultadoXP | null = null;
        if (xpTotal > 0) {
            const motivos = [
                pendientes.length > 0 ? `${pendientes.length} logro(s)` : '',
                xpAdicional > 0 ? motivoAdicional : ''
            ].filter(Boolean);
            resultadoXP = await procesarObtencionXPEnTransaccion(
                db,
                idPerfil,
                xpTotal,
                motivos.join(' + ')
            );
        }

        await db.run(`
            UPDATE Perfil_Recompensa
            SET xp_procesada = 1
            WHERE Id_perfil = ? AND xp_procesada = 0
        `, [idPerfil]);

        return {
            resultadoXP,
            logrosConXP: pendientes.map((recompensa) => recompensa.Id_recompensa)
        };
    });
};

export const obtenerEstadoXP = async (idPerfil: number) => {
    const db = getDB();
    const perfil = await db.get(
        'SELECT xp_acumulada, nivel FROM Perfil WHERE Id_perfil = ?',
        [idPerfil]
    );
    if (!perfil) throw new Error('Perfil no encontrado');

    const xpAcumulada = Number(perfil.xp_acumulada ?? 0);
    const nivel = Number(perfil.nivel ?? 1);
    const xpActualEnNivel = xpAcumulada % XP_POR_NIVEL;
    const porcentajeProgreso = nivel < NIVEL_MAXIMO
        ? Math.round((xpActualEnNivel / XP_POR_NIVEL) * 100)
        : 100;

    return {
        nivel,
        xpAcumulada,
        xpParaSiguienteNivel: nivel < NIVEL_MAXIMO ? XP_POR_NIVEL : 0,
        xpActualEnNivel: nivel < NIVEL_MAXIMO ? xpActualEnNivel : XP_POR_NIVEL,
        porcentaje: porcentajeProgreso,
        esNivelMaximo: nivel >= NIVEL_MAXIMO
    };
};

export const obtenerXpFaltanteParaNivel = async (idPerfil: number): Promise<number> => {
    const db = getDB();
    const perfil = await db.get(
        'SELECT xp_acumulada, nivel FROM Perfil WHERE Id_perfil = ?',
        [idPerfil]
    );

    if (!perfil || Number(perfil.nivel) >= NIVEL_MAXIMO) return 0;

    const xpActualEnNivel = Number(perfil.xp_acumulada ?? 0) % XP_POR_NIVEL;
    return XP_POR_NIVEL - xpActualEnNivel;
};
