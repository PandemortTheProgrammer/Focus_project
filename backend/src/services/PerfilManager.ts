// backend/src/services/PerfilManager.ts
import { getDB } from '../config/db';

export const obtenerEnfoques = async (): Promise<{ id: number; nombre: string }[]> => {
    const db = getDB();
    return await db.all("SELECT * FROM Enfoque");
};

// POST/PUT: Registrar o actualizar el perfil único
export const guardarPerfil = async (datos: { nickname: string; age_rank: string; genero: string; id_focus: string | number; id_icono?: number | null }): Promise<void> => {
    const db = getDB();

    const idIcono = typeof datos.id_icono === 'number' && datos.id_icono > 0 ? datos.id_icono : 1;

    // 1. Verificamos si el perfil 1 ya existe en la base de datos
    const perfilExistente = await db.get("SELECT Id_perfil FROM Perfil WHERE Id_perfil = 1");

    if (perfilExistente) {
        // 2A. SI YA EXISTE: Actualizamos SIN borrar. 
        // Esto salva la vida de la tabla Perfil_Recompensa
        const queryUpdate = `
            UPDATE Perfil 
            SET nickname = ?, 
                rango_edad = ?, 
                Id_enfoque = ?, 
                genero = ?, 
                Id_icono = ?
            WHERE Id_perfil = 1
        `;
        await db.run(queryUpdate, [
            datos.nickname,
            datos.age_rank,
            datos.id_focus,
            datos.genero,
            idIcono,
        ]);
        console.log("👤 Perfil actualizado con éxito (Recompensas a salvo)");
    } else {
        // 2B. SI NO EXISTE: Es la primera vez que entran a la app, insertamos normal.
        const queryInsert = `
            INSERT INTO Perfil (Id_perfil, nickname, rango_edad, Id_enfoque, genero, Id_icono)
            VALUES (1, ?, ?, ?, ?, ?)
        `;
        await db.run(queryInsert, [
            datos.nickname,
            datos.age_rank,
            datos.id_focus,
            datos.genero,
            idIcono,
        ]);
        console.log("👤 Perfil nuevo guardado con éxito en la tabla SQLite");
    }
};

// GET: Recuperar el perfil activo para el Dashboard
export const obtenerPerfil = async (): Promise<{ id: number; nickname: string; rango_edad: string; Id_enfoque: number; genero: string; Id_icono: number | null } | null> => {
    const db = getDB();
    const query = `SELECT * FROM Perfil LIMIT 1`;
    const perfil = await db.get(query);
    return perfil;
};