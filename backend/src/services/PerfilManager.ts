// backend/src/services/PerfilManager.ts
import { getDB } from '../config/db';


// backend/src/services/PerfilManager.ts
export const obtenerEnfoques = async (): Promise<any[]> => {
    const db = getDB();
    return await db.all("SELECT * FROM Enfoque"); 
};

// POST: Registrar o actualizar el perfil único
export const guardarPerfil = async (datos: any): Promise<void> => {
    const db = getDB();

    // Al ser una arquitectura local-first con un único usuario, 
    // limpiamos cualquier rastro interino antes de guardar el nuevo.
    await db.run("DELETE FROM Perfil");

    // RAW SQL: Inserción limpia respetando las columnas de tu diccionario
    const query = `
        INSERT INTO Perfil (nickname, rango_edad, Id_enfoque)
        VALUES (?, ?, ?)
    `;

    await db.run(query, [
        datos.nickname,
        datos.age_rank,
        parseInt(datos.id_focus)
    ]);

    console.log("👤 Perfil guardado con éxito en la tabla SQLite");
};

// GET: Recuperar el perfil activo para el Dashboard
export const obtenerPerfil = async (): Promise<any> => {
    const db = getDB();
    
    // Obtenemos la única fila existente
    const query = `SELECT * FROM Perfil LIMIT 1`;
    const perfil = await db.get(query);
    
    return perfil; 
};