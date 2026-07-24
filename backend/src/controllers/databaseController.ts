// backend/src/controllers/databaseController.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { cerrarBD, inicializarBD } from '../config/db';

// 1. FUNCIÓN DE CARGA (UPLOAD)
export const uploadDatabase = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No se recibió ningún archivo.' });
            return;
        }

        const tempFilePath = req.file.path; 
        const targetDbPath = path.resolve(process.cwd(), 'focus_database.sqlite'); 

        await cerrarBD();
        fs.copyFileSync(tempFilePath, targetDbPath);
        fs.unlinkSync(tempFilePath);
        await inicializarBD();

        console.log("✅ Base de datos reemplazada y sistema reconectado con éxito.");
        res.json({ success: true, message: 'Perfil cargado y conectado correctamente.' });

    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        console.error('❌ Error crítico al cargar la base de datos:', error);
        
        try {
            await inicializarBD();
        } catch (reconnectError) {
            console.error('No se pudo reconectar la BD tras el fallo.');
        }

        res.status(500).json({ error: 'Error interno al procesar el archivo SQLite: ' + mensaje });
    }
};

// 2. NUEVA FUNCIÓN DE DESCARGA (DOWNLOAD) - Heredada de sistemaRoutes
export const downloadDatabase = (req: Request, res: Response): void => {
    const dbPath = path.resolve(process.cwd(), 'focus_database.sqlite');

    if (fs.existsSync(dbPath)) {
        res.download(dbPath, 'mi_respaldo_focus.sqlite', (err) => {
            if (err) {
                console.error("Error al enviar el archivo:", err);
                if (!res.headersSent) {
                    res.status(500).send("No se pudo descargar la base de datos.");
                }
            }
        });
    } else {
        res.status(404).json({ error: "La base de datos aún no existe." });
    }
};