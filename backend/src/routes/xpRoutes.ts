import { Router } from 'express';
import { getProgresoXP, reclamarXP, sincronizarXPLogros } from '../controllers/xpController';

const router = Router();

// GET: Para dibujar la barra de nivel y XP en el Dashboard o el perfil
router.get('/progreso', getProgresoXP);

// POST: Migra una sola vez la XP de logros obtenidos antes de habilitar XP por logro.
router.post('/sincronizar-logros', sincronizarXPLogros);

// POST: Para enviar XP por acciones superficiales del frontend
router.post('/otorgar', reclamarXP);

export default router;