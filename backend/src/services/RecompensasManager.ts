// backend/src/services/recompensasManager.ts
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

export const obtenerCatalogoIconos = async (): Promise<Icono[]> => {
    const db = getDB();
    const filas: RecompensaRow[] = await db.all(
        `SELECT Id_icono, nombre_icono FROM Icono ORDER BY Id_icono ASC`
    );

    return filas.map((fila) => new Icono(
        Number(fila.Id_icono ?? 0),
        String(fila.nombre_icono ?? '')
    ));
};

const mapRowToPerfilRecompensa = (row: PerfilRecompensaRow): Recompensa_perfil => {
    return new Recompensa_perfil(
        Number(row.Id_perfil ?? 0),
        Number(row.Id_recompensa ?? 0),
        row.fecha_obtencion ? new Date(row.fecha_obtencion) : new Date()
    );
};

export const obtenerRecompensasDePerfil = async (idPerfil: number) => {
    const db = getDB();
    const query = `
        SELECT r.Id_recompensa, r.nombre_recompensa, r.descripcion, r.tipo_recompensa, i.Id_icono, i.nombre_icono
        FROM Recompensa r
        JOIN Perfil_Recompensa pr ON r.Id_recompensa = pr.Id_recompensa
        LEFT JOIN Icono i ON r.Id_icono = i.Id_icono
        WHERE pr.Id_perfil = ?
    `;

    const filas: RecompensaRow[] = await db.all(query, [idPerfil]);
    
    return filas.map(row => ({
        Id_recompensa: Number(row.Id_recompensa ?? 0),
        nombre_recompensa: String(row.nombre_recompensa ?? ''),
        descripcion: String(row.descripcion ?? ''),
        tipo_recompensa: String(row.tipo_recompensa ?? 'ICONO'),
        Id_icono: row.Id_icono ?? row.Id_icono_recompensa,
        nombre_icono: String(row.nombre_icono ?? 'Ícono Especial') 
    }));
};

// 2. El motor de evaluación actualizado con parámetro opcional 'eventoEspecial'
export const evaluarNuevosLogros = async (idPerfil: number, eventoEspecial?: string) => {
    const db = getDB();
    const nuevosLogrosIds: number[] = [];

    const obtenidas = await db.all(
        `SELECT Id_recompensa FROM Perfil_Recompensa WHERE Id_perfil = ?`,
        [idPerfil]
    );
    const idsObtenidas = new Set(obtenidas.map((fila) => Number(fila.Id_recompensa)));

    // --- REGLA 1: Iniciador (Id_recompensa: 2) ---
    if (!idsObtenidas.has(2)) {
        const conteoActividades = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteoActividades?.total ?? 0) >= 1) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 2]);
            nuevosLogrosIds.push(2);
        }
    }

    // --- REGLA 2: Maratonista (Id_recompensa: 3) ---
    if (!idsObtenidas.has(3)) {
        const horas = await db.get(`SELECT SUM(durac_min) as totalMinutos FROM Actividad`);
        if ((horas?.totalMinutos ?? 0) >= 600) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 3]);
            nuevosLogrosIds.push(3);
        }
    }

    // --- REGLA 7: Salvado (Id_recompensa: 7) ---
    // Requiere que el controlador le pase explícitamente el evento 'DESCARGA_PERFIL'
    if (!idsObtenidas.has(7) && eventoEspecial === 'DESCARGA_PERFIL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 7]);
        nuevosLogrosIds.push(7);
    }

    // --- REGLA 8: Imparable (Id_recompensa: 8) ---
    // Se activa al llegar a 50 actividades registradas
    if (!idsObtenidas.has(8)) {
        const conteoActividades = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteoActividades?.total ?? 0) >= 50) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 8]);
            nuevosLogrosIds.push(8);
        }
    }

    // --- REGLA 9: Lechuza (Id_recompensa: 9) ---
    // Se activa si existe alguna actividad cuya hora de inicio esté entre las 00:00 y las 04:00 am
    if (!idsObtenidas.has(9)) {
        const actividadNocturna = await db.get(`
            SELECT 1 FROM Actividad 
            WHERE hora_inicio >= '00:00' AND hora_inicio <= '04:00' 
            LIMIT 1
        `);
        if (actividadNocturna) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 9]);
            nuevosLogrosIds.push(9);
        }
    }

    // Si no ganó nada nuevo en esta evaluación, salimos en silencio
    if (nuevosLogrosIds.length === 0) {
        return [];
    }

    const placeholders = nuevosLogrosIds.map(() => '?').join(',');
    const query = `
        SELECT r.Id_recompensa, r.nombre_recompensa, r.descripcion, r.tipo_recompensa, i.Id_icono, i.nombre_icono
        FROM Recompensa r
        LEFT JOIN Icono i ON r.Id_icono = i.Id_icono
        WHERE r.Id_recompensa IN (${placeholders})
    `;

    const filasRecientes = await db.all(query, nuevosLogrosIds);
    
    return filasRecientes.map(row => ({
        Id_recompensa: Number(row.Id_recompensa ?? 0),
        nombre_recompensa: String(row.nombre_recompensa ?? ''),
        descripcion: String(row.descripcion ?? ''),
        tipo_recompensa: String(row.tipo_recompensa ?? 'ICONO'),
        Id_icono: row.Id_icono ?? row.Id_icono_recompensa,
        nombre_icono: String(row.nombre_icono ?? '') 
    }));
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