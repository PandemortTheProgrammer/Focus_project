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
        // 1. Validación de campos obligatorios para la alerta de "Advertencia"
        const { id_tipo, hora_inicio, duracion_minutos } = req.body;
        if (!id_tipo || !hora_inicio || duracion_minutos === undefined) {
            res.status(400).json({ error: "Faltan campos por rellenar. Por favor completa todos los datos obligatorios." });
            return;
        }

        // 2. Registrar actividad (se tipa como 'any' por si en el futuro modificas 
        // ActividadManager para que devuelva un objeto con los logros/reportes)
        const resultado: any = await registrarActividad(req.body); 
        
        // 3. Respuesta estructurada para los Toasts de Éxito, Logro y Reporte
        res.status(201).json({ 
            mensaje: "La actividad se registró con éxito.",
            logroDesbloqueado: resultado?.logroDesbloqueado || null,
            reporteGenerado: resultado?.reporteGenerado || false
        });
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
            res.status(404).json({ error: `La actividad ${idBorrar} no existe o ya fue eliminada.` });
            return;
        }
        if (resultado === 'bloqueada') {
            res.status(403).json({ error: 'La actividad superó la medianoche y ya no puede eliminarse.' });
            return;
        }
        
        res.json({ mensaje: `Actividad eliminada correctamente.` });
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

router.put('/:id', async (req, res) => {
    try {
        // Validación de campos vacíos en edición
        if (Object.keys(req.body).length === 0) {
            res.status(400).json({ error: "No se enviaron datos para actualizar." });
            return;
        }

        const id = parseInt(req.params.id);
        const actualizada = await editarActividad(id, req.body);

        if (actualizada === null) {
            res.status(404).json({ error: `La actividad ${id} no fue encontrada.` });
            return;
        }
        if (actualizada === 'bloqueada') {
            res.status(403).json({ error: 'La actividad superó la medianoche y ya no puede editarse.' });
            return;
        }
        
        res.json({ mensaje: "Los cambios de tu actividad fueron guardados.", actividad: actualizada });
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