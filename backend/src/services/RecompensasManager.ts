// src/managers/recompensasManager.ts
import { getDB } from '../config/db';
import Recompensa from '../models/Recompensa';
import Icono from '../models/Icono';
import Recompensa_perfil from '../models/Recompensa_perfil';

interface RecompensaRow {
    Id_recompensa?: number;
    nombre_recompensa?: string;
    descripcion?: string;
    tipo_recompensa?: string;
    Id_icono?: number;
    Id_icono_recompensa?: number;
    nombre_icono?: string;
}

interface PerfilRecompensaRow {
    Id_perfil?: number;
    Id_recompensa?: number;
    fecha_obtencion?: string | null;
}

interface ConteoRow {
    total?: number;
}

interface SumaMinutosRow {
    totalMinutos?: number | null;
}

const mapRowToRecompensa = (row: RecompensaRow): Recompensa => {
    return new Recompensa(
        Number(row.Id_recompensa ?? 0),
        String(row.nombre_recompensa ?? ''),
        String(row.descripcion ?? ''),
        String(row.tipo_recompensa ?? 'ICONO'),
        row.Id_icono ?? row.Id_icono_recompensa
    );
};

const mapRowToIcono = (row: RecompensaRow): Icono => {
    return new Icono(
        Number(row.Id_icono ?? row.Id_icono_recompensa ?? 0),
        String(row.nombre_icono ?? '')
    );
};

const mapRowToPerfilRecompensa = (row: PerfilRecompensaRow): Recompensa_perfil => {
    return new Recompensa_perfil(
        Number(row.Id_perfil ?? 0),
        Number(row.Id_recompensa ?? 0),
        row.fecha_obtencion ? new Date(row.fecha_obtencion) : new Date()
    );
};

// 1. Obtener las recompensas (e íconos) que el usuario ya desbloqueó
export const obtenerRecompensasDePerfil = async (idPerfil: number): Promise<Recompensa[]> => {
    const db = getDB();
    const query = `
        SELECT r.Id_recompensa, r.nombre_recompensa, r.descripcion, r.tipo_recompensa, i.Id_icono, i.nombre_icono
        FROM Recompensa r
        JOIN Perfil_Recompensa pr ON r.Id_recompensa = pr.Id_recompensa
        LEFT JOIN Icono i ON r.Id_icono = i.Id_icono
        WHERE pr.Id_perfil = ?
    `;

    const filas: RecompensaRow[] = await db.all(query, [idPerfil]);
    return filas.map(mapRowToRecompensa);
};

// 2. El motor de evaluación (Esta función hace la magia en segundo plano)
export const evaluarNuevosLogros = async (idPerfil: number): Promise<void> => {
    const db = getDB();

    const obtenidas: Array<{ Id_recompensa: number }> = await db.all(
        `SELECT Id_recompensa FROM Perfil_Recompensa WHERE Id_perfil = ?`,
        [idPerfil]
    );
    const idsObtenidas = new Set(obtenidas.map((fila) => Number(fila.Id_recompensa)));

    // --- REGLA 1: Iniciador (Id_recompensa: 2) ---
    if (!idsObtenidas.has(2)) {
        const conteoActividades = await db.get<ConteoRow>(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteoActividades?.total ?? 0) >= 1) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 2]);
        }
    }

    // --- REGLA 2: Maratonista (Id_recompensa: 3) ---
    if (!idsObtenidas.has(3)) {
        const horas = await db.get<SumaMinutosRow>(`SELECT SUM(durac_min) as totalMinutos FROM Actividad`);
        if ((horas?.totalMinutos ?? 0) >= 600) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 3]);
        }
    }
};

export const obtenerIconosDesbloqueados = async (idPerfil: number): Promise<Icono[]> => {
    const db = getDB();
    const query = `
        SELECT i.Id_icono, i.nombre_icono
        FROM Recompensa r
        JOIN Perfil_Recompensa pr ON r.Id_recompensa = pr.Id_recompensa
        JOIN Icono i ON r.Id_icono = i.Id_icono
        WHERE pr.Id_perfil = ? AND r.tipo_recompensa = 'ICONO'
    `;

    const filas: RecompensaRow[] = await db.all(query, [idPerfil]);
    return filas.map(mapRowToIcono);
};

export const obtenerRelacionesPerfilRecompensa = async (idPerfil: number): Promise<Recompensa_perfil[]> => {
    const db = getDB();
    const query = `
        SELECT Id_perfil, Id_recompensa, fecha_obtencion
        FROM Perfil_Recompensa
        WHERE Id_perfil = ?
        ORDER BY fecha_obtencion DESC
    `;

    const filas: PerfilRecompensaRow[] = await db.all(query, [idPerfil]);
    return filas.map(mapRowToPerfilRecompensa);
};