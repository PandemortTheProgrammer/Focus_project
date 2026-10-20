import { getDB } from '../config/db'; // Tu conexión a SQLite

// 1. Obtener todos los bloques (unimos con la tabla de tipos para tener el color y nombre)
export const obtenerBloquesIdeales = async () => {
    const db = getDB();
    const query = `
        SELECT 
            b.id_bloque, 
            b.id_tipo, 
            b.duracion_minutos, 
            b.hora_inicio,
            t.nombre_tipo,
            t.codigo_color,
            t.nivel_presencia
        FROM Dia_Ideal_Bloques b
        JOIN Tipo_actividad t ON b.id_tipo = t.id_tipo
    `;
    return await db.all(query);
}; 

// 2. Crear un bloque nuevo (nace en el banco, hora_inicio = null)
export const crearBloqueIdeal = async (id_tipo: number, duracion_minutos: number) => {
    const db = getDB();
    const query = `INSERT INTO Dia_Ideal_Bloques (id_tipo, duracion_minutos, hora_inicio) VALUES (?, ?, NULL)`;
    const result = await db.run(query, [id_tipo, duracion_minutos]);
    return result.lastID;
};

// 3. Actualizar la posición de un bloque (cuando el usuario lo arrastra y suelta)
export const moverBloqueIdeal = async (id_bloque: number, hora_inicio: string | null) => {
    const db = getDB();
    const query = `UPDATE Dia_Ideal_Bloques SET hora_inicio = ? WHERE id_bloque = ?`;
    await db.run(query, [hora_inicio, id_bloque]);
};

// 4. Eliminar un bloque
export const eliminarBloqueIdeal = async (id_bloque: number) => {
    const db = getDB();
    const query = `DELETE FROM Dia_Ideal_Bloques WHERE id_bloque = ?`;
    await db.run(query, [id_bloque]);
};