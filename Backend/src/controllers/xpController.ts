import { Request, Response } from 'express';
import * as xpManager from '../services/xpManager';
import { evaluarNuevosLogros } from '../services/RecompensasManager';

export const getProgresoXP = async (req: Request, res: Response) => {
    try {
        const estado = await xpManager.obtenerEstadoXP(1);
        res.json(estado);
    } catch (error) {
        console.error("Error al obtener XP:", error);
        res.status(500).json({ error: "No se pudo obtener el progreso de experiencia." });
    }
};

export const reclamarXP = async (req: Request, res: Response) => {
    try {
        const { cantidad, motivo } = req.body;
        
        if (!Number.isSafeInteger(cantidad) || cantidad <= 0 || typeof motivo !== 'string' || !motivo.trim()) {
            return res.status(400).json({ error: "Cantidad y motivo son obligatorios." });
        }

        const resultado = await xpManager.procesarObtencionXP(1, cantidad, motivo);
        res.json(resultado);
    } catch (error) {
        console.error("Error al otorgar XP:", error);
        res.status(500).json({ error: "Fallo al procesar la experiencia." });
    }
};

export const sincronizarXPLogros = async (_req: Request, res: Response) => {
    try {
        const sincronizacion = await xpManager.procesarXPLogrosPendientes(1);
        const sincronizacionHitos = await xpManager.procesarObtencionXP(1, 0, 'Sincronización de hitos por nivel');
        const evaluacionV2 = await evaluarNuevosLogros(
            1,
            undefined,
            0,
            'Acción completada',
            true
        );
        const resultadosXP = [
            sincronizacion.resultadoXP,
            sincronizacionHitos,
            evaluacionV2.resultadoXP
        ].filter((resultado): resultado is NonNullable<typeof resultado> => resultado !== null);
        const resultadoXP = resultadosXP.length > 0
            ? {
                ...resultadosXP[resultadosXP.length - 1],
                xpOtorgada: resultadosXP.reduce((total, resultado) => total + resultado.xpOtorgada, 0),
                subioNivel: resultadosXP.some((resultado) => resultado.subioNivel),
                nivelesEscalados: resultadosXP.reduce((total, resultado) => total + resultado.nivelesEscalados, 0),
                hitos: resultadosXP.flatMap((resultado) => resultado.hitos),
                logrosDesbloqueados: resultadosXP.flatMap((resultado) => resultado.logrosDesbloqueados)
            }
            : null;
        res.json({
            ...evaluacionV2,
            resultadoXP,
            logrosConXP: [
                ...sincronizacion.logrosConXP,
                ...evaluacionV2.logrosDesbloqueados.map((logro) => logro.Id_recompensa)
            ]
        });
    } catch (error) {
        console.error("Error al sincronizar la XP de logros:", error);
        res.status(500).json({ error: "No se pudo sincronizar la experiencia de logros." });
    }
};
