// src/routes/recompensasRoutes.ts
import { Router, Request, Response } from 'express';
import {
    obtenerRecompensasDePerfil,
    obtenerIconosDesbloqueados,
    obtenerRelacionesPerfilRecompensa
} from '../services/RecompensasManager';

const router = Router();

// GET /api/recompensas/perfil/:idPerfil
router.get('/perfil/:idPerfil', async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const recompensas = await obtenerRecompensasDePerfil(idPerfil);
        res.json(recompensas);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener recompensas:', error);
        res.status(500).json({ error: mensaje });
    }
});

// GET /api/recompensas/iconos/:idPerfil
router.get('/iconos/:idPerfil', async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const iconos = await obtenerIconosDesbloqueados(idPerfil);
        res.json(iconos);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener iconos desbloqueados:', error);
        res.status(500).json({ error: mensaje });
    }
});

// GET /api/recompensas/relaciones/:idPerfil
router.get('/relaciones/:idPerfil', async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const relaciones = await obtenerRelacionesPerfilRecompensa(idPerfil);
        res.json(relaciones);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener relaciones perfil-recompensa:', error);
        res.status(500).json({ error: mensaje });
    }
});

// GET /api/recompensas/:idPerfil (compatibilidad)
router.get('/:idPerfil', async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const recompensas = await obtenerRecompensasDePerfil(idPerfil);
        res.json(recompensas);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener recompensas:', error);
        res.status(500).json({ error: mensaje });
    }
});

export default router;