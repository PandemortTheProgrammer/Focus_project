// backend/src/controllers/reportesController.ts
import { Request, Response } from 'express';
import { obtenerResumenesSemanales } from '../services/ReporteManager';

export const getResumenesSemanales = async (req: Request, res: Response): Promise<void> => {
    try {
        // El manager ahora devolverá un objeto con los reportes y los logros
        const resultado = await obtenerResumenesSemanales();
        
        res.json({
            reportes: resultado.reportes,
            logrosDesbloqueados: resultado.logrosDesbloqueados
        });
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
};