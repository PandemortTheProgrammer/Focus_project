// backend/src/routes/focusRoutes.ts
import { Router } from 'express';
import { 
  obtenerActividades, 
  registrarActividad, 
  eliminarActividad,
  editarActividad,
  actividadesSemana,
  obtenerTiposActividad,
  obtenerResumenesSemanales
} from '../services/ActividadManager';
import Tipo_actividad from '../models/Tipo_actividad';

const router = Router();

// GET: Obtener tipos para el Select de Activities_add
router.get('/tipos-actividad', async (req, res) => {
    try {
        const tipos = await obtenerTiposActividad();
        const tiposFormateados = tipos.map((t: Tipo_actividad) => ({
            id_tipo: t.id_tipo,
            nombre_tipo: t.nombre_tipo
        }));
        res.json(tiposFormateados);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

// GET: Obtener todas las actividades
router.get('/', async (req, res) => {
    try {
        const lista = await obtenerActividades();
        res.json(lista);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

// POST: Guardar nueva actividad
router.post('/', async (req, res) => {
    try {
        await registrarActividad(req.body);
        res.status(201).json({ mensaje: "Actividad registrada en la BD" });
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

// DELETE: Borrar actividad por ID
router.delete('/:id', async (req, res) => {
    try {
        const idBorrar = parseInt(req.params.id);
        await eliminarActividad(idBorrar);
        res.json({ mensaje: `Actividad ${idBorrar} eliminada con éxito` });
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
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
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

// GET: Actividades agrupadas por día de los últimos 7 días
router.get('/semana', async (req, res) => {
    try {
        const datos = await actividadesSemana();
        res.json(datos);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

// GET: Resúmenes semanales por semana completa (lunes a domingo)
router.get('/semanas', async (req, res) => {
    try {
        const resumenes = await obtenerResumenesSemanales();
        res.json(resumenes);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

export default router;