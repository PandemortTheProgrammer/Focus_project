// backend/src/routes/actividadRoutes.ts
import { Router } from 'express';
import * as ActividadController from '../controllers/actividadController';

const router = Router();

// Rutas de utilidades y catálogos
router.get('/tipos-actividad', ActividadController.getTiposActividad);
router.get('/semana', ActividadController.getActividadesSemana);
router.get('/historial', ActividadController.getHistorialActividades);

// Rutas del CRUD principal
router.get('/', ActividadController.getActividades);
router.post('/', ActividadController.createActividad);
router.put('/:id', ActividadController.updateActividad);
router.delete('/:id', ActividadController.deleteActividad);

export default router;