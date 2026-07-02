// backend/src/routes/focusRoutes.ts
import { Router } from 'express';
import { obtenerActividades, registrarActividad, eliminarActividad } from '../services/ActividadManager';
// backend/src/routes/focusRoutes.ts
import { obtenerTiposActividad } from '../services/ActividadManager';

const router = Router();

// ...

router.get('/tipos-actividad', async (req, res) => {
    try {
        const tipos = await obtenerTiposActividad();
        // Mapeamos los nombres de columnas de la BD a lo que espera React
        const tiposFormateados = tipos.map(t => ({
            id_tipo: t.Id_tipo,
            nombre_tipo: t.Nombre_activ
        }));
        res.json(tiposFormateados);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar tipos" });
    }
});
// ... la ruta de tipos-actividad queda igual ...

router.get('/', async (req, res) => {
    const lista = await obtenerActividades();
    res.json(lista);
});

router.post('/', async (req, res) => {
    await registrarActividad(req.body);
    res.status(201).json({ mensaje: "Actividad registrada en la BD" });
});

router.delete('/:id', async (req, res) => {
    const idBorrar = parseInt(req.params.id);
    await eliminarActividad(idBorrar);
    res.json({ mensaje: "Actividad eliminada" });
});

export default router;