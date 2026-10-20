import { getDB } from '../config/db'; 
import { evaluarNuevosLogros } from './RecompensasManager';

// Tipado para la inserción
export interface DatosPlantilla {
    id_tipo: number;
    titulo_plantilla: string;
    desc_activ_default: string | null;
    durac_min_default: number | null;
}

/**
 * Guarda una nueva plantilla (o un clon de una actividad existente)
 */
export const crearPlantillaManager = async (
    datos: DatosPlantilla,
    idActividadOrigen?: number
): Promise<{
    id_plantilla: number;
    logrosDesbloqueados: unknown[];
    resultadoXP: unknown;
}> => {
    const db = getDB();
    const query = `
        INSERT INTO Plantilla_Actividad (id_tipo, titulo_plantilla, desc_activ_default, durac_min_default)
        VALUES (?, ?, ?, ?)
    `;
    
    const result = await db.run(query, [
        datos.id_tipo,
        datos.titulo_plantilla,
        datos.desc_activ_default || null,
        datos.durac_min_default || null
    ]);

    if (result.lastID === undefined) {
        throw new Error('No se pudo obtener el ID de la plantilla creada');
    }

    const actividadAntigua = idActividadOrigen
        ? await db.get(
            "SELECT 1 FROM Actividad WHERE Id_actividad = ? AND date(fecha) <= date('now', '-14 days')",
            [idActividadOrigen]
        )
        : null;
    const recompensa = await evaluarNuevosLogros(
        1,
        actividadAntigua ? 'PLANTILLA_ACTIVIDAD_ANTIGUA' : undefined
    );

    return {
        id_plantilla: result.lastID,
        logrosDesbloqueados: recompensa.logrosDesbloqueados,
        resultadoXP: recompensa.resultadoXP
    };
};

/**
 * Obtiene todas las plantillas, cruzando los datos con Tipo_actividad
 * para extraer el nombre de la categoría y su color para la interfaz.
 */
export const obtenerPlantillasManager = async () => {
    const db = getDB();
    const query = `
        SELECT 
            p.id_plantilla,
            p.id_tipo,
            p.titulo_plantilla,
            p.desc_activ_default,
            p.durac_min_default,
            t.Nombre_activ AS nombre_categoria,
            t.Codigo_color AS color_categoria 
        FROM Plantilla_Actividad p
        INNER JOIN Tipo_actividad t ON p.id_tipo = t.Id_tipo
        ORDER BY p.id_plantilla DESC
    `;
    
    // Si tu columna de color en Tipo_actividad se llama distinto (ej. 'color_hex'), ajusta el 't.Color'
    return await db.all(query);
};

/**
 * Elimina una plantilla específica de la base de datos
 */
export const eliminarPlantillaManager = async (id_plantilla: number): Promise<void> => {
    const db = getDB();
    const query = `DELETE FROM Plantilla_Actividad WHERE id_plantilla = ?`;
    
    await db.run(query, [id_plantilla]);
};