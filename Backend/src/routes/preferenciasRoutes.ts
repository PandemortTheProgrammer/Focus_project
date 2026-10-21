import { Router } from 'express';
import * as PreferenciasController from '../controllers/preferenciasController';

const router = Router();

router.get('/', PreferenciasController.getPreferencias);
router.patch('/:nombre', PreferenciasController.patchPreferencia);

export default router;
