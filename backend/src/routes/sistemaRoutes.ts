import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// GET: Descargar la base de datos completa
router.get('/descargar-bd', (req, res) => {
    // 1. Ubicamos dónde está físicamente el archivo SQLite.
    // Usamos path.resolve para asegurar que encuentre la ruta sin importar desde dónde corras el servidor
    const dbPath = path.resolve(__dirname, '../../focus_database.sqlite');

    // 2. Verificamos que el archivo realmente exista
    if (fs.existsSync(dbPath)) {
        // res.download es una función nativa de Express que prepara los headers HTTP 
        // automáticamente para forzar la descarga de un archivo.
        // El segundo parámetro es el nombre con el que se le guardará al usuario.
        res.download(dbPath, 'mi_respaldo_focus.sqlite', (err) => {
            if (err) {
                console.error("Error al enviar el archivo:", err);
                res.status(500).send("No se pudo descargar la base de datos.");
            }
        });
    } else {
        res.status(404).json({ error: "La base de datos aún no existe." });
    }
});

export default router;