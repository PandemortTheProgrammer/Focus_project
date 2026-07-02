// backend/src/services/ActividadManager.ts
import { getDB } from '../config/db';
import Actividad from '../models/Actividad';
// ... tu arreglo de catalogoTipos se mantiene igual por ahora ...



// backend/src/services/ActividadManager.ts
export const obtenerTiposActividad = async (): Promise<any[]> => {
    const db = getDB();
    // Recuerda que en tu db.ts las columnas se llaman Id_tipo y Nombre_activ
    return await db.all("SELECT * FROM Tipo_actividad"); 
};
// 1. POST: Guardar en la Base de Datos Real
export const registrarActividad = async (datos: any): Promise<void> => {
    const db = getDB();
    
    // RAW SQL: Comando de inserción
    const query = `
        INSERT INTO Actividad (id_tipo, hora_inicio, durac_min, desc_activ)
        VALUES (?, ?, ?, ?)
    `;
    
    // Los signos '?' evitan inyecciones SQL. Pasamos los valores en un arreglo.
    await db.run(query, [
        parseInt(datos.id_tipo),
        datos.hora_inicio,
        datos.duracion_minutos,
        datos.descripcion_actividad
    ]);
    
    console.log("Actividad guardada en SQLite");
};

// 2. GET: Obtener desde la Base de Datos Real
export const obtenerActividades = async (): Promise<any[]> => {
    const db = getDB();
    
    // RAW SQL: Comando de lectura
    const query = `SELECT * FROM Actividad ORDER BY id_actividad DESC`;
    
    const filas = await db.all(query);
    return filas; // Retorna los datos directamente a la ruta
};

// 3. DELETE: Eliminar de la Base de Datos Real
export const eliminarActividad = async (id: number): Promise<void> => {
    const db = getDB();
    
    const query = `DELETE FROM Actividad WHERE id_actividad = ?`;
    await db.run(query, [id]);
};