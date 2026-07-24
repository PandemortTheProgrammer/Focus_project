// backend/src/controllers/reportesController.ts
import { Request, Response } from 'express';
import { obtenerResumenesSemanales } from '../services/ReporteManager';

export const getResumenesSemanales = async (req: Request, res: Response): Promise<void> => {
    try {
        const resumenes = await obtenerResumenesSemanales();
        res.json(resumenes);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
};