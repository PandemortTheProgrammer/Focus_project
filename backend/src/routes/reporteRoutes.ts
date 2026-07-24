// backend/src/routes/reportesRoutes.ts
import { Router } from 'express';
import * as ReportesController from '../controllers/reportesController';

const router = Router();

router.get('/semanas', ReportesController.getResumenesSemanales);

export default router;