import {Router} from 'express';

import ActividadManager from '../services/ActividadManager';
import Actividad from "../Models/Actividad";
import Enfoque from '../Models/Enfoque';
import Rep_semanal from '../Models/Rep-semanal';
import Tipo_actividad from '../Models/Tipo_actividad';

const router = Router();
const act_manager = new ActividadManager();

//Aqui va el router.get
router.get('/', (req, res) => {
    res.json(act_manager.obteneractividades());
});

export default router;