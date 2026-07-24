// backend/src/routes/recompensasRoutes.ts
import { Router } from 'express';
import * as RecompensasController from '../controllers/recompensasController';

const router = Router();

// Rutas estáticas o sin ID (van primero para evitar colisiones)
router.get('/iconos', RecompensasController.getCatalogoIconos);
router.post('/evaluar-evento', RecompensasController.evaluarEventoEspecial);

// Rutas dinámicas (que reciben :idPerfil)
router.get('/perfil/:idPerfil', RecompensasController.getRecompensasDePerfil);
router.get('/iconos/:idPerfil', RecompensasController.getIconosDesbloqueados);
router.get('/relaciones/:idPerfil', RecompensasController.getRelacionesPerfil);

// Ruta de compatibilidad (apunta exactamente a la misma función del controlador)
router.get('/:idPerfil', RecompensasController.getRecompensasDePerfil);

export default router;