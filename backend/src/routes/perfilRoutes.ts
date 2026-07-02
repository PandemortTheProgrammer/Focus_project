import { Router } from 'express';
import Perfil from '../models/Perfil';

const router = Router();

let perfilUsuario: Perfil;

// POST: Guarda el perfil 
router.post('/', (req, res) => {
    perfilUsuario = req.body;
    res.status(201).json({ mensaje: "Perfil guardado", perfil: perfilUsuario });
});

// GET: Devuelve el perfil guardado
router.get('/', (req, res) => {
    if (!perfilUsuario) {
        return res.status(404).json({ error: "No hay perfil registrado aún" });
    }
    res.json(perfilUsuario);
});

export default router;