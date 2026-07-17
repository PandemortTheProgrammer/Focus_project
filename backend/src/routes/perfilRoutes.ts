// backend/src/routes/perfilRoutes.ts
import { Router } from 'express';
import { guardarPerfil, obtenerPerfil } from '../services/PerfilManager';
// backend/src/routes/perfilRoutes.ts
import { obtenerEnfoques } from '../services/PerfilManager';

const router = Router();


// ...

router.get('/enfoques', async (req, res) => {
    try {
        const enfoques = await obtenerEnfoques();
        res.json(enfoques);
    } catch (error: unknown) {
        const mensaje = error instanceof Error ? error.message : "Error desconocido";
        res.status(500).json({ error: mensaje });
    }
});

// POST: http://localhost:3000/api/perfil
router.post('/', async (req, res) => {
    try {
        await guardarPerfil(req.body);
        res.status(201).json({ mensaje: "Perfil almacenado físicamente en la BD" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al escribir en la base de datos" });
    }
});

// GET: http://localhost:3000/api/perfil
router.get('/', async (req, res) => {
    try {
        const perfil = await obtenerPerfil();
        if (!perfil) {
            return res.status(404).json({ error: "No se encontró ningún perfil en la BD" });
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
        res.status(500).json({ error: "Error al leer la base de datos" });
    }
});

export default router;