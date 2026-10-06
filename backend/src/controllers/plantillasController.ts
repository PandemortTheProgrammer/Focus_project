import { Request, Response } from 'express';
import { 
    crearPlantillaManager, 
    obtenerPlantillasManager, 
    eliminarPlantillaManager 
} from '../services/PlantillasManager'; // Ajusta la ruta a la ubicación real de tu manager

export const getPlantillas = async (req: Request, res: Response): Promise<void> => {
    try {
        const plantillas = await obtenerPlantillasManager();
        res.status(200).json(plantillas);
    } catch (error) {
        console.error("Error al obtener las plantillas:", error);
        res.status(500).json({ error: "Ocurrió un error al cargar tus plantillas guardadas." });
    }
};

export const crearPlantilla = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const { id_tipo, titulo_plantilla, desc_activ_default, durac_min_default } = req.body;

        // Validaciones obligatorias
        if (!id_tipo || isNaN(parseInt(id_tipo))) {
            return res.status(400).json({ error: "El tipo de actividad es obligatorio y debe ser válido." });
        }
        
        if (!titulo_plantilla || titulo_plantilla.trim() === '') {
            return res.status(400).json({ error: "Debes asignarle un título a la plantilla." });
        }

        // Normalización de datos opcionales para SQLite
        const datosParaGuardar = {
            id_tipo: parseInt(id_tipo),
            titulo_plantilla: titulo_plantilla.trim().substring(0, 50), // Respetando el VARCHAR(50) de la BD
            desc_activ_default: desc_activ_default && desc_activ_default.trim() !== '' 
                ? desc_activ_default.trim().substring(0, 255) 
                : null,
            durac_min_default: durac_min_default && !isNaN(parseInt(durac_min_default)) 
                ? parseInt(durac_min_default) 
                : null
        };

        const nuevaPlantillaId = await crearPlantillaManager(datosParaGuardar);
        
        res.status(201).json({ 
            mensaje: "Plantilla creada exitosamente.", 
            id_plantilla: nuevaPlantillaId 
        });
    } catch (error) {
        console.error("Error al guardar la plantilla:", error);
        res.status(500).json({ error: "No se pudo guardar la plantilla en la base de datos." });
    }
};

export const eliminarPlantilla = async (req: Request, res: Response): Promise<Response | void> => {
    try {
        const idParam = req.params.id;
        const id_plantilla = parseInt(Array.isArray(idParam) ? idParam[0] ?? '' : idParam);

        if (isNaN(id_plantilla)) {
            return res.status(400).json({ error: "ID de plantilla no válido." });
        }

        await eliminarPlantillaManager(id_plantilla);
        
        res.status(200).json({ mensaje: "Plantilla eliminada correctamente." });
    } catch (error) {
        console.error("Error al eliminar la plantilla:", error);
        res.status(500).json({ error: "Ocurrió un error al intentar borrar la plantilla." });
    }
};