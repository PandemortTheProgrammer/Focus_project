// backend/src/routes/reportesRoutes.ts
import { Router } from 'express';
import { obtenerResumenesSemanales } from '../services/ReporteManager';

const router = Router();

// GET: Resúmenes semanales por semana completa (lunes a domingo)
// Ruta base esperada: /api/reportes/semanas
router.get('/semanas', async (req, res) => {
    try {
        const resumenes = await obtenerResumenesSemanales();
        res.json(resumenes);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

export default router;