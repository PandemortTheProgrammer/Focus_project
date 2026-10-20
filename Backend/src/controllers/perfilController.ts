// backend/src/controllers/perfilController.ts
import { Request, Response } from 'express';
import path from 'path';
import { guardarPerfil, obtenerPerfil, obtenerEnfoques, reiniciarPerfilYDatos, obtenerDetallesEnfoque, actualizarPin, actualizarEnfoque } from '../services/PerfilManager';
import { evaluarNuevosLogros } from '../services/RecompensasManager';

export const getEnfoques = async (req: Request, res: Response): Promise<void> => {
    try {
        const enfoques = await obtenerEnfoques();
        res.json(enfoques);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
};

export const getEnfoqueDetalles = async (req: Request, res: Response) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const idEnfoque = parseInt(idParam, 10);
        
        if (isNaN(idEnfoque)) {
            return res.status(400).json({ error: "ID de enfoque no válido." });
        }

        const detalles = await obtenerDetallesEnfoque(idEnfoque);
        
        if (!detalles) {
            return res.status(404).json({ error: "Enfoque no encontrado en los catálogos." });
        }

        const gamificacion = await evaluarNuevosLogros(1, 'VISITA_DETALLES_ENFOQUE');
        res.json({
            ...detalles,
            logrosDesbloqueados: gamificacion.logrosDesbloqueados,
            resultadoXP: gamificacion.resultadoXP
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al recuperar los detalles del enfoque." });
    }
};

export const actualizarPinPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pin, pista_pin } = req.body;

        // Validación básica de seguridad en el backend
        if (pin !== null && pin !== undefined) {
            if (typeof pin !== 'string' || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
                res.status(400).json({ error: "El PIN debe ser un código numérico exacto de 4 dígitos." });
                return;
            }
        }

        const resultado = await actualizarPin(pin || null, pista_pin || null);

        res.status(200).json({ 
            mensaje: pin ? "PIN y pista de recuperación configurados exitosamente." : "PIN de seguridad desactivado.",
            ...resultado
        });
    } catch (error) {
        console.error("Error al actualizar el PIN del perfil:", error);
        res.status(500).json({ error: "Ocurrió un error al intentar actualizar la seguridad del perfil." });
    }
};

export const getPerfilActivo = async (req: Request, res: Response) => {
    try {
        const perfil = await obtenerPerfil();
        if (!perfil) {
            return res.status(404).json({ error: "No se encontró ningún perfil. Debes crear uno." });
        }
        
        const perfilNormalizado = {
            nickname: perfil.nickname,
            age_rank: perfil.rango_edad,
            genero: perfil.genero,
            id_focus: perfil.Id_enfoque,
            id_icono: perfil.Id_icono ?? 1,
            pin: perfil.pin ?? null,
            pista_pin: perfil.pista_pin ?? null,
            nivel: perfil.nivel, // <-- Útil si el frontend quiere mostrar el nivel actual aquí
            xp_acumulada: perfil.xp_acumulada
        };
        
        res.json(perfilNormalizado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al leer la base de datos local." });
    }
};

export const crearOEditarPerfil = async (req: Request, res: Response) => {
    try {
        const { nickname, age_rank, genero, id_focus } = req.body;

        if (!nickname || nickname.trim() === '') {
            return res.status(400).json({ error: "El apodo (nickname) no puede estar vacío." });
        }
        if (!age_rank || !genero) { 
            return res.status(400).json({ error: "Faltan campos por seleccionar." });
        }

        const datosParaGuardar = {
            ...req.body,
            id_focus: id_focus || null 
        };

        // Capturamos el resultado de XP (25 XP si fue edición, 0 si fue creación)
        const resultadoXP = await guardarPerfil(datosParaGuardar);
        
        res.status(201).json({ 
            mensaje: "Perfil guardado.",
            resultadoXP // <-- Inyectado para el frontend
        });
    } catch (error) {
        console.error("Error al crear o editar el perfil:", error);
        res.status(500).json({ error: "Error interno al guardar los datos del perfil." });
    }
};

export const descargarPerfil = (req: Request, res: Response) => {
    try {
        const dbPath = path.join(__dirname, '../../focus_database.sqlite'); 
        
        res.download(dbPath, 'Focus_database.sqlite', (err) => {
            if (err) {
                console.error("Error al descargar la base de datos:", err);
                if (!res.headersSent) {
                    res.status(500).json({ error: "No se pudo generar el archivo de respaldo." });
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Error interno al preparar la descarga." });
    }
};

export const resetearPerfil = async (req: Request, res: Response) => {
    try {
        await reiniciarPerfilYDatos();
        res.status(200).json({ mensaje: "Perfil y datos eliminados correctamente. Listo para empezar de cero." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "No se pudo reiniciar la base de datos." });
    }
};

export const cambiarEnfoque = async (req: Request, res: Response) => {
    try {
        const { id_focus } = req.body;
        if (!id_focus) return res.status(400).json({ error: "Falta el ID del enfoque." });
        
        // Capturamos el resultado de XP (2000 si es el primero, 100 si son posteriores)
        const resultado = await actualizarEnfoque(id_focus);
        
        res.status(200).json({ 
            mensaje: "Enfoque actualizado con éxito.",
            ...resultado
        });
    } catch (error) {
        console.error("Error al cambiar enfoque:", error);
        res.status(500).json({ error: "No se pudo actualizar tu enfoque." });
    }
};