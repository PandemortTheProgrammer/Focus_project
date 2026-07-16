// backend/src/services/PerfilManager.ts
import { getDB } from '../config/db';

export const obtenerEnfoques = async (): Promise<{ id: number; nombre: string }[]> => {
    const db = getDB();
    return await db.all("SELECT * FROM Enfoque");
};

// POST: Registrar o actualizar el perfil único
export const guardarPerfil = async (datos: { nickname: string; age_rank: string; genero: string; id_focus: string; id_icono?: string | number | null }): Promise<void> => {
    const db = getDB();

    // Al ser una arquitectura local-first con un único usuario,
    // limpiamos cualquier rastro interino antes de guardar el nuevo.
    await db.run("DELETE FROM Perfil");

    const idIcono = datos.id_icono === '' || datos.id_icono === null || datos.id_icono === undefined
        ? 0
        : Number(datos.id_icono);

    const query = `
        INSERT INTO Perfil (Id_perfil, nickname, rango_edad, Id_enfoque, genero, Id_icono)
        VALUES (1, ?, ?, ?, ?, ?)
    `;

    await db.run(query, [
        datos.nickname,
        datos.age_rank,
        Number.parseInt(datos.id_focus, 10) || 0,
        datos.genero,
        idIcono,
    ]);

    console.log("👤 Perfil guardado con éxito en la tabla SQLite");
};

// GET: Recuperar el perfil activo para el Dashboard
export const obtenerPerfil = async (): Promise<{ id: number; nickname: string; rango_edad: string; Id_enfoque: number; genero: string; Id_icono: number | null } | null> => {
    const db = getDB();

    const query = `SELECT * FROM Perfil LIMIT 1`;
    const perfil = await db.get(query);

    return perfil;
};