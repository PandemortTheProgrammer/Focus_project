// backend/src/controllers/actividadController.ts
import { Request, Response } from 'express';
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

export const getTiposActividad = async (req: Request, res: Response): Promise<void> => {
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
};

export const getActividades = async (req: Request, res: Response): Promise<void> => {
    try {
        const lista = await obtenerActividades();
        res.json(lista);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
};

export const createActividad = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Validación de campos obligatorios para la alerta de "Advertencia"
        const { id_tipo, hora_inicio, duracion_minutos } = req.body;
        if (!id_tipo || !hora_inicio || duracion_minutos === undefined) {
            res.status(400).json({ error: "Faltan campos por rellenar. Por favor completa todos los datos obligatorios." });
            return;
        }

        // 2. Registrar actividad
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
};

export const deleteActividad = async (req: Request, res: Response): Promise<void> => {
    try {
        // Usamos String() para asegurar que TypeScript reciba un string puro
        const idBorrar = parseInt(String(req.params.id), 10);
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
};

export const updateActividad = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validación de campos vacíos en edición
        if (Object.keys(req.body).length === 0) {
            res.status(400).json({ error: "No se enviaron datos para actualizar." });
            return;
        }

        // Misma corrección aquí con String()
        const id = parseInt(String(req.params.id), 10);
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
};

export const getActividadesSemana = async (req: Request, res: Response): Promise<void> => {
    try {
        const datos = await actividadesSemana();
        res.json(datos);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
};

export const getHistorialActividades = async (req: Request, res: Response): Promise<void> => {
    try {
        const historial = await obtenerHistorialActividades();
        res.json(historial);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
};