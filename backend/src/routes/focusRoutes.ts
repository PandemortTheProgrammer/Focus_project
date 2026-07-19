// backend/src/routes/focusRoutes.ts
import { Router } from 'express';
import { 
  obtenerActividades, 
  registrarActividad, 
  eliminarActividad,
  editarActividad,
  actividadesSemana,
  obtenerTiposActividad,
  obtenerHistorialActividades
} from '../services/ActividadManager';
import Tipo_actividad from '../models/Tipo_actividad';

const router = Router();

router.get('/tipos-actividad', async (req, res) => {
    try {
        const tipos = await obtenerTiposActividad();
        const tiposFormateados = tipos.map((t: Tipo_actividad) => ({
            id_tipo: t.id_tipo,
            nombre_tipo: t.nombre_tipo,
            utilidad_objetiva: t.utilidad_objetiva,
            codigo_color: t.codigo_color
        }));
        res.json(tiposFormateados);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

router.get('/', async (req, res) => {
    try {
        const lista = await obtenerActividades();
        res.json(lista);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

router.post('/', async (req, res) => {
    try {
        await registrarActividad(req.body);
        res.status(201).json({ mensaje: "Actividad registrada en la BD" });
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const idBorrar = parseInt(req.params.id);
        const resultado = await eliminarActividad(idBorrar);

        if (resultado === 'no_encontrada') {
            res.status(404).json({ mensaje: `Actividad ${idBorrar} no encontrada` });
            return;
        }
        if (resultado === 'bloqueada') {
            res.status(403).json({ mensaje: 'La actividad ya fue archivada (24h) y no puede eliminarse.' });
            return;
        }
        res.json({ mensaje: `Actividad ${idBorrar} eliminada con éxito` });
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const actualizada = await editarActividad(id, req.body);

        if (actualizada === null) {
            res.status(404).json({ mensaje: `Actividad ${id} no encontrada` });
            return;
        }
        if (actualizada === 'bloqueada') {
            res.status(403).json({ mensaje: 'La actividad ya fue archivada (24h) y no puede editarse.' });
            return;
        }
        res.json({ mensaje: "Actividad actualizada", actividad: actualizada });
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

router.get('/semana', async (req, res) => {
    try {
        const datos = await actividadesSemana();
        res.json(datos);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

router.get('/historial', async (req, res) => {
    try {
        const historial = await obtenerHistorialActividades();
        res.json(historial);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

export default router;