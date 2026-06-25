//Configurar Express
import express from "express";
import cors from "cors";

// import servicioRoutes from "./routes/servicioRoutes";

const app = express();
app.use(cors());
app.use(express.json());

app.use(  // app.use(ruta, controlador);
    "/servicios",
    // servicioRoutes
);

app.get("/", (req, res) => { //req y res para solicitar y emitir respuestas desde back

    res.json({
        mensaje: "Backend Focus funcionando"
    });

});

export default app;