// backend/src/routes/focusRoutes.ts
import { Router } from 'express';
import { catalogoTipos, listaActividades, registrarActividad, eliminarActividad } from '../services/ActividadManager';

const router = Router();

// GET: Obtener tipos para el Select de Activities_add
router.get('/tipos-actividad', (req, res) => {
    res.json(catalogoTipos);
});

// GET: Obtener todas las actividades para Activities_main
router.get('/', (req, res) => {
    res.json(listaActividades);
});

// POST: Guardar nueva actividad
router.post('/', (req, res) => {
    const nueva = registrarActividad(req.body);
    res.status(201).json({ mensaje: "Actividad registrada", actividad: nueva });
});

// DELETE: Borrar actividad por ID
router.delete('/:id', (req, res) => {
    const idBorrar = parseInt(req.params.id);
    eliminarActividad(idBorrar);
    res.json({ mensaje: `Actividad ${idBorrar} eliminada con éxito` });
});

export default router;