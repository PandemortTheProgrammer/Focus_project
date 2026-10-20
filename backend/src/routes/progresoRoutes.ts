import { Router } from 'express';
import { getGeneralProgress, postPrimeraVisitaSemanal } from '../controllers/progresoController'; // Ajusta la ruta

const router = Router();

// Endpoint para el "Muro de Métricas" superior
router.get('/general', getGeneralProgress);
router.post('/visita-semanal', postPrimeraVisitaSemanal);

// (Espacio reservado para el futuro endpoint del motor de horarios)
// router.get('/dia-real', getDiaReal);

export default router;