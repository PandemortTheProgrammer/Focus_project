// backend/src/controllers/recompensasController.ts
import { Request, Response } from 'express';
import {
    obtenerRecompensasDePerfil,
    obtenerIconosDesbloqueados,
    obtenerRelacionesPerfilRecompensa,
    obtenerCatalogoIconos,
    evaluarNuevosLogros,
    obtenerCatalogoRecompensasConEstado
} from '../services/RecompensasManager';

export const getRecompensasDePerfil = async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const recompensas = await obtenerRecompensasDePerfil(idPerfil);
        res.json(recompensas);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener recompensas:', error);
        res.status(500).json({ error: mensaje });
    }
};

export const getCatalogoIconos = async (_req: Request, res: Response): Promise<void> => {
    try {
        const iconos = await obtenerCatalogoIconos();
        res.json(iconos);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener catálogo de iconos:', error);
        res.status(500).json({ error: mensaje });
    }
};

export const getIconosDesbloqueados = async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const iconos = await obtenerIconosDesbloqueados(idPerfil);
        res.json(iconos);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener iconos desbloqueados:', error);
        res.status(500).json({ error: mensaje });
    }
};

export const getRelacionesPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const relaciones = await obtenerRelacionesPerfilRecompensa(idPerfil);
        res.json(relaciones);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener relaciones perfil-recompensa:', error);
        res.status(500).json({ error: mensaje });
    }
};

export const getCatalogoRecompensasCompleto = async (req: Request, res: Response): Promise<void> => {
    try {
        const idPerfil = Number(req.params.idPerfil);
        const catalogo = await obtenerCatalogoRecompensasConEstado(idPerfil);
        res.json(catalogo);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al obtener el catálogo completo de recompensas:', error);
        res.status(500).json({ error: mensaje });
    }
};

export const evaluarEventoEspecial = async (req: Request, res: Response): Promise<void> => {
    try {
        const { eventoEspecial } = req.body;
        
        // Asumiendo que estamos evaluando siempre al perfil 1 (local-first)
        const idPerfil = 1; 

        // Pasamos la bandera al motor que acabamos de actualizar
        const logrosNuevos = await evaluarNuevosLogros(idPerfil, eventoEspecial);

        res.json({ logrosDesbloqueados: logrosNuevos });
    } catch (error) {
        console.error("Error al evaluar evento especial:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};