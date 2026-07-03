import app from "../app";
import Perfil from "../models/Perfil";

let perfilUsuario: Perfil = new Perfil(1, "Usuario", "20-30", 1);

// Ruta para GUARDAR el perfil
app.post('/api/perfil', (req, res) => {
    const { nickname, age_rank, id_focus } = req.body;
    
    // Guardamos los datos en la memoria de Node
    perfilUsuario = new Perfil(1, nickname, age_rank, id_focus);
    
    console.log("Perfil guardado en Express:", perfilUsuario);
    res.status(201).json({ mensaje: "Perfil creado", perfil: perfilUsuario });
});

// Ruta para OBTENER el perfil (por si recargan la página)
app.get('/api/perfil', (req, res) => {
    if (!perfilUsuario) {
        return res.status(404).json({ error: "No hay perfil registrado" });
    }
    res.json(perfilUsuario);
});