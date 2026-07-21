// backend/src/routes/perfilRoutes.ts
import { Router } from 'express';
import { guardarPerfil, obtenerPerfil, obtenerEnfoques } from '../services/PerfilManager';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuración de Multer para recibir el archivo SQLite temporalmente
const upload = multer({ dest: 'uploads/' });

// ---------------------------------------------------------
// 1. OBTENER ENFOQUES (Catálogo)
// ---------------------------------------------------------
router.get('/enfoques', async (req, res) => {
    try {
        const enfoques = await obtenerEnfoques();
        res.json(enfoques);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

// ---------------------------------------------------------
// 2. OBTENER PERFIL (Carga inicial)
// ---------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const perfil = await obtenerPerfil();
        if (!perfil) {
            // El código 404 le dirá al frontend que debe ir a la pantalla de "Crear Perfil"
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
});

// ---------------------------------------------------------
// 3. CREAR / EDITAR PERFIL
// ---------------------------------------------------------
router.post('/', async (req, res) => {
    try {
        const { nickname, age_rank, genero, id_focus } = req.body;

        // Validaciones para que el Frontend muestre un Toast de "Advertencia"
        if (!nickname || nickname.trim() === '') {
            return res.status(400).json({ error: "El apodo (nickname) no puede estar vacío." });
        }
        if (!age_rank || !genero || !id_focus) {
            return res.status(400).json({ error: "Faltan campos por seleccionar para completar el perfil." });
        }

        await guardarPerfil(req.body);
        
        // Respuesta estructurada para el Toast de "Éxito"
        res.status(201).json({ mensaje: "Tu perfil ha sido guardado exitosamente." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ocurrió un error al escribir en tu archivo local." });
    }
});

// ---------------------------------------------------------
// 4. DESCARGAR BASE DE DATOS (Exportar Perfil)
// ---------------------------------------------------------
router.get('/descargar', (req, res) => {
    try {
        // AJUSTA ESTA RUTA dependiendo de dónde esté tu archivo focus.sqlite
        // Ejemplo: Si el sqlite está en backend/database/focus.sqlite
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
});

// ---------------------------------------------------------
// 5. CARGAR BASE DE DATOS (Importar Perfil)
// ---------------------------------------------------------
router.post('/cargar', upload.single('database'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se recibió ningún archivo válido." });
        }

        const tempPath = req.file.path;
        // Misma ruta del archivo que usaste en /descargar
        const targetPath = path.join(__dirname, '../../focus_database.sqlite'); 

        // Reemplazamos la base de datos actual con la que subió el usuario
        fs.copyFileSync(tempPath, targetPath);
        fs.unlinkSync(tempPath); // Borramos el archivo temporal de Multer

        res.status(200).json({ mensaje: "¡Perfil restaurado con éxito! Tus datos locales han sido actualizados." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "El archivo no es válido o hubo un error al restaurar." });
    }
});

export default router;