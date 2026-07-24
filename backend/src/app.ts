//Configurar Express
import express from "express";
import cors from "cors";
import actividadRoutes from "./routes/actividadRoutes";
import perfilRoutes from "./routes/perfilRoutes";
import recompensasRoutes from "./routes/recompensasRoutes";
import reporteRoutes from "./routes/reporteRoutes";
import databaseRoutes from "./routes/databaseRoutes";

// Abajo con tus app.use:
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/actividades", actividadRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/recompensas", recompensasRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/database', databaseRoutes);
app.get("/", (req, res) => { //req y res para solicitar y emitir respuestas desde back
    res.json({
        mensaje: "Backend Focus funcionando"
    });
});

export default app;