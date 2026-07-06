// backend/src/routes/focusRoutes.ts
import { Router } from 'express';
import { 
  obtenerActividades, 
  registrarActividad, 
  eliminarActividad,
  editarActividad,
  actividadesSemana,
  obtenerTiposActividad
} from '../services/ActividadManager';

const router = Router();

// GET: Obtener tipos para el Select de Activities_add
router.get('/tipos-actividad', async (req, res) => {
    try {
        const tipos = await obtenerTiposActividad();
        const tiposFormateados = tipos.map((t: any) => ({
            id_tipo: t.Id_tipo,
            nombre_tipo: t.Nombre_activ
        }));
        res.json(tiposFormateados);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar tipos" });
    }
});

// GET: Obtener todas las actividades
router.get('/', async (req, res) => {
    try {
        const lista = await obtenerActividades();
        res.json(lista);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener actividades" });
    }
});

// POST: Guardar nueva actividad
router.post('/', async (req, res) => {
    try {
        await registrarActividad(req.body);
        res.status(201).json({ mensaje: "Actividad registrada en la BD" });
    } catch (error) {
        res.status(500).json({ error: "Error al registrar actividad" });
    }
});

// DELETE: Borrar actividad por ID
router.delete('/:id', async (req, res) => {
    try {
        const idBorrar = parseInt(req.params.id);
        await eliminarActividad(idBorrar);
        res.json({ mensaje: `Actividad ${idBorrar} eliminada con éxito` });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar actividad" });
    }
});

// PUT: Editar actividad por ID
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const actualizada = await editarActividad(id, req.body);
        if (!actualizada) {
            res.status(404).json({ mensaje: `Actividad ${id} no encontrada` });
            return;
        }
        res.json({ mensaje: "Actividad actualizada", actividad: actualizada });
    } catch (error) {
        res.status(500).json({ error: "Error al editar actividad" });
    }
});

// GET: Actividades agrupadas por día de los últimos 7 días
router.get('/semana', async (req, res) => {
    try {
        const datos = await actividadesSemana();
        res.json(datos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener progreso semanal" });
    }
});

export default router;