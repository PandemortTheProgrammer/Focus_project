// backend/src/controllers/perfilController.ts
import { Request, Response } from 'express';
import path from 'path';
import { guardarPerfil, obtenerPerfil, obtenerEnfoques, reiniciarPerfilYDatos } from '../services/PerfilManager';

export const getEnfoques = async (req: Request, res: Response): Promise<void> => {
    try {
        const enfoques = await obtenerEnfoques();
        res.json(enfoques);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
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
            id_icono: perfil.Id_icono ?? 1
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
        if (!age_rank || !genero || !id_focus) {
            return res.status(400).json({ error: "Faltan campos por seleccionar para completar el perfil." });
        }

        await guardarPerfil(req.body);
        
        res.status(201).json({ mensaje: "Tu perfil ha sido guardado exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ocurrió un error al escribir en tu archivo local." });
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