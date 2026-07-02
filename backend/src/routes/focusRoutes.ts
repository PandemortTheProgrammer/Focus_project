import {Router} from 'express';

// import Actividad from "../Models/Actividad";
// import Enfoque from '../Models/Enfoque';
// import Rep_semanal from '../Models/Rep-semanal';
// import Tipo_actividad from '../Models/Tipo_actividad';

import { catalogoTipos, listaActividades } from '../services/ActividadManager';
import app from '../app';

app.get('/api/tipos-actividad', (req, res) => {
    // Devuelve el arreglo de objetos Tipo_actividad que creaste con tu clase
    return res.json(catalogoTipos); 
});

const router = Router();

//Aqui va el router.get
router.get('/', (req, res) => {
    res.json(listaActividades);
});


export default router;