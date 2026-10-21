import { getDB } from '../config/db'; // Ajusta la ruta a tu archivo db.ts
import { otorgarXPEventoUnico, type ResultadoXP } from './xpManager';
import { evaluarNuevosLogros } from './RecompensasManager';
import { obtenerInicioSemanaLocal } from '../utils/fechas';

export const reclamarPrimeraVisitaSemanal = async () => {
    const inicioSemana = obtenerInicioSemanaLocal(new Date());

    const xpSemanal = await otorgarXPEventoUnico(
        1,
        'VISITA_MI_PROGRESO',
        inicioSemana,
        800,
        'Primera visita semanal a Mi progreso'
    );
    const recompensa = await evaluarNuevosLogros(1, 'VISITA_PROGRESO');
    const resultadoXP: ResultadoXP | null = recompensa.resultadoXP
        ? {
            ...recompensa.resultadoXP,
            xpOtorgada: (xpSemanal?.xpOtorgada ?? 0) + recompensa.resultadoXP.xpOtorgada,
            subioNivel: Boolean(xpSemanal?.subioNivel || recompensa.resultadoXP.subioNivel),
            nivelesEscalados: (xpSemanal?.nivelesEscalados ?? 0) + recompensa.resultadoXP.nivelesEscalados,
            hitos: [...(xpSemanal?.hitos ?? []), ...recompensa.resultadoXP.hitos],
            logrosDesbloqueados: [
                ...(xpSemanal?.logrosDesbloqueados ?? []),
                ...recompensa.resultadoXP.logrosDesbloqueados
            ]
        }
        : xpSemanal;
    return { resultadoXP, logrosDesbloqueados: recompensa.logrosDesbloqueados };
};

export const getProgressStats = async () => {
    const db = getDB();
    
    // Al ser local, asumimos el Perfil 1
    const perfil = await db.get("SELECT nickname, Id_icono, Id_tarjeta, fecha_creacion FROM Perfil WHERE Id_perfil = 1");
    // Conteos generales
    const actCount = await db.get("SELECT COUNT(Id_actividad) as total FROM Actividad");
    const repCount = await db.get("SELECT COUNT(Id_reporte) as total FROM Reporte_semanal");
    
    // Promedio de optimización histórico
    const optAvg = await db.get("SELECT AVG(Prog_optimizac) as promedio FROM Reporte_semanal");
    
    // Mantener separados los logros de sistema y los hitos de nivel.
    const progresoLogros = await db.get(`
        SELECT
            COUNT(r.Id_recompensa) as totales,
            COUNT(pr.Id_recompensa) as desbloqueados
        FROM Recompensa r
        LEFT JOIN Perfil_Recompensa pr
            ON pr.Id_recompensa = r.Id_recompensa AND pr.Id_perfil = 1
        WHERE r.coleccion IN ('V1', 'V2')
    `);
    const progresoHitos = await db.get(`
        SELECT
            COUNT(r.Id_recompensa) as totales,
            COUNT(pr.Id_recompensa) as desbloqueados
        FROM Recompensa r
        LEFT JOIN Perfil_Recompensa pr
            ON pr.Id_recompensa = r.Id_recompensa AND pr.Id_perfil = 1
        WHERE r.coleccion = 'HITO'
    `);

    return {
        nickname: perfil?.nickname || "Usuario",
        idIcono: perfil?.Id_icono || 1,
        idTarjeta: perfil?.Id_tarjeta || 1,
        fechaCreacion: perfil?.fecha_creacion || new Date().toISOString(),
        totalActividades: actCount?.total || 0,
        totalReportes: repCount?.total || 0,
        // Math.round para evitar decimales infinitos en la interfaz
        optimizacionPromedio: Math.round(optAvg?.promedio || 0),
        logrosDesbloqueados: progresoLogros?.desbloqueados || 0,
        logrosTotales: progresoLogros?.totales || 0,
        hitosDesbloqueados: progresoHitos?.desbloqueados || 0,
        hitosTotales: progresoHitos?.totales || 0
    };
};