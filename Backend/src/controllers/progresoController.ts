import { Request, Response } from 'express';
import * as progressManager from '../services/ProgresoManager'; // Ajusta la ruta

export const getGeneralProgress = async (req: Request, res: Response) => {
    try {
        const stats = await progressManager.getProgressStats();
        
        // 1. Cálculo de Semanas desde la creación
        // Convertimos ambas fechas a milisegundos para obtener la diferencia
        const fechaCreacionDate = new Date(stats.fechaCreacion);
        const hoy = new Date();
        const diferenciaMs = hoy.getTime() - fechaCreacionDate.getTime();
        const diasDesdeCreacion = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
        
        // Usamos Math.max(1) para que, si el usuario acaba de crear la cuenta hoy, 
        // aparezca como que está cursando su "semana 1" en la aplicación.
        const semanasDesdeCreacion = Math.max(1, Math.ceil(diasDesdeCreacion / 7)); 

        // 2. Cálculo del porcentaje de logros
        const porcentajeLogros = stats.logrosTotales > 0 
            ? Math.round((stats.logrosDesbloqueados / stats.logrosTotales) * 100) 
            : 0;
        const porcentajeHitos = stats.hitosTotales > 0
            ? Math.round((stats.hitosDesbloqueados / stats.hitosTotales) * 100)
            : 0;

        // 3. Formateo amigable de la fecha de creación (ej. "2026-10-08")
        const fechaFormateada = stats.fechaCreacion.split(' ')[0];

        // 4. Estructuración del JSON de respuesta
        res.json({
            usuario: {
                nombre: stats.nickname,
                idIcono: stats.idIcono
            },
            fechaCreacion: fechaFormateada,
            semanasDesdeCreacion: semanasDesdeCreacion,
            totalActividades: stats.totalActividades,
            semanasConReporte: stats.totalReportes,
            progresoLogros: {
                desbloqueados: stats.logrosDesbloqueados,
                totales: stats.logrosTotales,
                porcentaje: porcentajeLogros
            },
            progresoHitos: {
                desbloqueados: stats.hitosDesbloqueados,
                totales: stats.hitosTotales,
                porcentaje: porcentajeHitos
            },
            progresoOptimizacion: stats.optimizacionPromedio
        });
    } catch (error) {
        console.error("Error al obtener el progreso general:", error);
        res.status(500).json({ error: "Error interno del servidor al calcular el progreso general." });
    }
};

export const postPrimeraVisitaSemanal = async (req: Request, res: Response): Promise<void> => {
    try {
        const resultado = await progressManager.reclamarPrimeraVisitaSemanal();
        res.json(resultado);
    } catch (error) {
        console.error('Error al registrar la visita semanal a Mi progreso:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'No se pudo registrar la visita semanal.'
        });
    }
};