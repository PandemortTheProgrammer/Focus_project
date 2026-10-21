import { Request, Response } from 'express';
import { actualizarPreferencia, obtenerPreferencias } from '../services/PreferenciasManager';

export const getPreferencias = async (req: Request, res: Response): Promise<void> => {
    try {
        res.json(await obtenerPreferencias());
    } catch (error: unknown) {
        console.error('Error al recuperar las preferencias:', error);
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: mensaje });
    }
};

export const patchPreferencia = async (req: Request, res: Response): Promise<void> => {
    const nombre = String(req.params.nombre ?? '');
    const mostrarSimplificado: unknown = req.body?.mostrar_simplificado;

    if (!nombre.trim()) {
        res.status(400).json({ error: 'El nombre de la preferencia es obligatorio.' });
        return;
    }
    if (typeof mostrarSimplificado !== 'boolean') {
        res.status(400).json({ error: 'mostrar_simplificado debe ser un valor booleano.' });
        return;
    }

    try {
        const preferencia = await actualizarPreferencia(nombre, mostrarSimplificado);
        if (!preferencia) {
            res.status(404).json({ error: 'No se encontró la preferencia solicitada.' });
            return;
        }
        res.json(preferencia);
    } catch (error: unknown) {
        console.error('Error al actualizar la preferencia:', error);
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        res.status(500).json({ error: mensaje });
    }
};
