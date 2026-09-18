// backend/src/routes/perfilRoutes.ts
import { Router } from 'express';
import * as PerfilController from '../controllers/perfilController';

const router = Router();

// Rutas de catálogos y utilidades
router.get('/enfoques', PerfilController.getEnfoques);
router.get('/descargar', PerfilController.descargarPerfil);
router.get('/enfoque-detalles/:id', PerfilController.getEnfoqueDetalles);
router.delete('/reset', PerfilController.resetearPerfil);

// backend/src/routes/perfilRoutes.ts
router.put('/pin', PerfilController.configurarPin);

// Rutas principales del perfil (CRUD)
router.get('/', PerfilController.getPerfilActivo);
router.post('/', PerfilController.crearOEditarPerfil);

export default router;