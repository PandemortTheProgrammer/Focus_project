// backend/src/routes/perfilRoutes.ts
import { Router } from 'express';
import * as PerfilController from '../controllers/perfilController';

const router = Router();

// Rutas de catálogos y utilidades
router.get('/enfoques', PerfilController.getEnfoques);
router.get('/descargar', PerfilController.descargarPerfil);
router.delete('/reset', PerfilController.resetearPerfil);

// Rutas principales del perfil (CRUD)
router.get('/', PerfilController.getPerfilActivo);
router.post('/', PerfilController.crearOEditarPerfil);

export default router;