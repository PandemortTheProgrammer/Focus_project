//Configurar Express
import express from "express";
import cors from "cors";
import focusRoutes from "./routes/focusRoutes";
import perfilRoutes from "./routes/perfilRoutes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/actividades", focusRoutes); 
app.use("/api/perfil", perfilRoutes);
app.get("/", (req, res) => { //req y res para solicitar y emitir respuestas desde back
    res.json({
        mensaje: "Backend Focus funcionando"
    });
});

export default app;