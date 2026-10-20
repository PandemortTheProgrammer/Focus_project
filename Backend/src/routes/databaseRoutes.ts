// backend/src/routes/databaseRoutes.ts
import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import * as DatabaseController from '../controllers/databaseController';

const router = Router();

// Configuración de Multer
const tempDir = path.resolve(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
const upload = multer({ dest: tempDir });

// Rutas unificadas para el manejo del archivo físico de la BD
router.post('/upload', upload.single('database'), DatabaseController.uploadDatabase);
router.get('/descargar-bd', DatabaseController.downloadDatabase);

export default router;