// backend/src/routes/databaseRoutes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { cerrarBD, inicializarBD } from '../config/db';

const router = Router();

// Configuramos multer para que guarde los archivos en una carpeta "temp"
// Multer no crea la carpeta de destino automáticamente, así que la creamos si no existe
const tempDir = path.resolve(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
const upload = multer({ dest: tempDir });

// POST: /api/database/upload
router.post('/upload', upload.single('database'), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No se recibió ningún archivo.' });
            return;
        }

        // 1. Rutas de los archivos
        const tempFilePath = req.file.path; // Donde multer guardó el archivo temporalmente
        const targetDbPath = path.resolve(process.cwd(), 'focus_database.sqlite'); // La ruta real de tu BD

        // 2. Desconectar la base de datos actual
        await cerrarBD();

        // 3. Sobrescribir el archivo de la base de datos
        // Usamos copyFileSync en lugar de rename para evitar problemas entre diferentes discos/particiones
        fs.copyFileSync(tempFilePath, targetDbPath);

        // 4. Limpiar: Eliminar el archivo temporal
        fs.unlinkSync(tempFilePath);

        // 5. Reconectar la base de datos
        await inicializarBD();

        console.log("✅ Base de datos reemplazada y sistema reconectado con éxito.");
        res.json({ success: true, message: 'Perfil cargado y conectado correctamente.' });

    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        console.error('❌ Error crítico al cargar la base de datos:', error);
        
        // Intentamos reconectar en caso de que haya fallado a la mitad del proceso
        try {
            await inicializarBD();
        } catch (reconnectError) {
            console.error('No se pudo reconectar la BD tras el fallo.');
        }

        res.status(500).json({ error: 'Error interno al procesar el archivo SQLite: ' + mensaje });
    }
});

export default router;