//Configurar Express
import express from "express";
import cors from "cors";
import focusRoutes from "./routes/focusRoutes";
import perfilRoutes from "./routes/perfilRoutes";
import recompensasRoutes from "./routes/recompensasRoutes";
// Arriba con tus importaciones:
import sistemaRoutes from "./routes/sistemaRoutes";

// Abajo con tus app.use:
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/sistema", sistemaRoutes);
app.use("/api/actividades", focusRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/recompensas", recompensasRoutes);
app.get("/", (req, res) => { //req y res para solicitar y emitir respuestas desde back
    res.json({
        mensaje: "Backend Focus funcionando"
    });
});

export default app;