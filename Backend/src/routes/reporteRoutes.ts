// backend/src/routes/reportesRoutes.ts
import { Router } from 'express';
import * as ReportesController from '../controllers/reportesController';

const router = Router();

router.get('/semanas', ReportesController.getResumenesSemanales);
router.post('/semanas/:fechaInicio/leer', ReportesController.postLecturaResumen);

export default router;