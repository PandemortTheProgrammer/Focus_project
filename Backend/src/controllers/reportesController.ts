// backend/src/controllers/reportesController.ts
import { Request, Response } from 'express';
import { obtenerResumenesSemanales, registrarLecturaResumen } from '../services/ReporteManager';

export const getResumenesSemanales = async (req: Request, res: Response): Promise<void> => {
    try {
        // El manager ahora devolverá un objeto con los reportes y los logros
        const resultado = await obtenerResumenesSemanales();
        
        res.json(resultado);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
};

export const postLecturaResumen = async (req: Request, res: Response): Promise<void> => {
    const fechaInicio = req.params.fechaInicio;
    if (typeof fechaInicio !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) {
        res.status(400).json({ error: 'La fecha de inicio del resumen no es válida.' });
        return;
    }

    try {
        const resultado = await registrarLecturaResumen(1, fechaInicio);
        if (!resultado) {
            res.status(404).json({ error: 'No se encontró el resumen semanal solicitado.' });
            return;
        }
        res.json(resultado);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: mensaje });
    }
};