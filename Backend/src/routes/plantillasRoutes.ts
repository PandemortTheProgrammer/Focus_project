import { Router } from 'express';
import { 
    getPlantillas, 
    postVisitaPlantillas,
    crearPlantilla, 
    eliminarPlantilla 
} from '../controllers/plantillasController';

const router = Router();

// Ruta para obtener el catálogo completo de plantillas del usuario
router.get('/', getPlantillas);
router.post('/visita', postVisitaPlantillas);

// Ruta para guardar una nueva plantilla o clonar una actividad existente
router.post('/', crearPlantilla);

// Ruta para eliminar una plantilla específica (requiere el ID en la URL)
router.delete('/:id', eliminarPlantilla);

export default router;