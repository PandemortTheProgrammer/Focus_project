import { getDB } from '../config/db';

export interface Preferencia {
    Id_preferencia: number;
    nombre: string;
    mostrar_simplificado: boolean;
}

export const obtenerPreferencias = async (): Promise<Preferencia[]> => {
    const db = getDB();
    const filas = await db.all<Array<{
        Id_preferencia: number;
        nombre: string;
        mostrar_simplificado: number;
    }>>(`
        SELECT Id_preferencia, nombre, mostrar_simplificado
        FROM Preferencias
        ORDER BY Id_preferencia
    `);

    return filas.map((fila) => ({
        ...fila,
        mostrar_simplificado: Boolean(fila.mostrar_simplificado)
    }));
};

export const actualizarPreferencia = async (
    nombre: string,
    mostrarSimplificado: boolean
): Promise<Preferencia | null> => {
    const db = getDB();
    const resultado = await db.run(`
        UPDATE Preferencias
        SET mostrar_simplificado = ?
        WHERE nombre = ?
    `, [Number(mostrarSimplificado), nombre]);

    if (resultado.changes === 0) return null;

    const fila = await db.get<{
        Id_preferencia: number;
        nombre: string;
        mostrar_simplificado: number;
    }>(`
        SELECT Id_preferencia, nombre, mostrar_simplificado
        FROM Preferencias
        WHERE nombre = ?
    `, [nombre]);

    if (!fila) return null;
    return {
        ...fila,
        mostrar_simplificado: Boolean(fila.mostrar_simplificado)
    };
};
