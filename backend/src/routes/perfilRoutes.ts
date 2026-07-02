import { Router } from 'express';
// Importas las funciones que vayas a crear en tu PerfilManager
// import { guardarPerfil, obtenerPerfil } from '../services/PerfilManager'; 

const router = Router();

// Aquí va el POST para guardar
router.post('/', (req, res) => {
    // Aquí llamarás a guardarPerfil(req.body)
    res.status(201).json({ mensaje: "Perfil recibido en el backend", datos: req.body });
});

// Aquí va el GET para leer
router.get('/', (req, res) => {
    // Aquí llamarás a obtenerPerfil()
    res.json({ mensaje: "Aquí enviaremos el perfil guardado" });
});

export default router;