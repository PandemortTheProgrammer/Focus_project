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

interface CatalogoRecompensaRow extends RecompensaRow {
    estaDesbloqueado?: number;
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

export const obtenerCatalogoRecompensasConEstado = async (idPerfil: number) => {
    const db = getDB();
    
    // El CASE evalúa si existe un registro en Perfil_Recompensa para este usuario.
    // Si existe (IS NOT NULL), devuelve 1 (true). Si no, 0 (false).
    const query = `
        SELECT 
            r.Id_recompensa, 
            r.nombre_recompensa, 
            r.descripcion, 
            r.tipo_recompensa, 
            i.Id_icono, 
            i.nombre_icono,
            CASE WHEN pr.Id_perfil IS NOT NULL THEN 1 ELSE 0 END as estaDesbloqueado
        FROM Recompensa r
        LEFT JOIN Icono i ON r.Id_icono = i.Id_icono
        LEFT JOIN Perfil_Recompensa pr ON r.Id_recompensa = pr.Id_recompensa AND pr.Id_perfil = ?
        ORDER BY r.Id_recompensa ASC
    `;

    const filas: CatalogoRecompensaRow[] = await db.all(query, [idPerfil]);
    
    return filas.map(row => ({
        Id_recompensa: Number(row.Id_recompensa ?? 0),
        nombre_recompensa: String(row.nombre_recompensa ?? ''),
        descripcion: String(row.descripcion ?? ''),
        tipo_recompensa: String(row.tipo_recompensa ?? 'ICONO'),
        Id_icono: row.Id_icono,
        nombre_icono: String(row.nombre_icono ?? ''),
        estaDesbloqueado: Boolean(row.estaDesbloqueado) // Convertimos el 1 o 0 a booleano nativo
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

    // --- REGLA 1: Bienvenida (Id_recompensa: 1) ---
    // Se otorga automáticamente al iniciar el perfil. Si no lo tiene, se lo damos de inmediato.
    if (!idsObtenidas.has(1)) {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 1]);
        nuevosLogrosIds.push(1);
    }

    // --- REGLA 2: Iniciador (Id_recompensa: 2) ---
    if (!idsObtenidas.has(2)) {
        const conteoActividades = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteoActividades?.total ?? 0) >= 1) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 2]);
            nuevosLogrosIds.push(2);
        }
    }

    // --- REGLA 3: Constancia (Id_recompensa: 3) ---
    if (!idsObtenidas.has(3)) {
        const horas = await db.get(`SELECT SUM(durac_min) as totalMinutos FROM Actividad`);
        if ((horas?.totalMinutos ?? 0) >= 600) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 3]);
            nuevosLogrosIds.push(3);
        }
    }

    // --- REGLAS 4, 5 y 13: Reportes Semanales (Ids: 4, 5 y 13) ---
    // Evaluamos los tres logros de una sola vez contando la tabla de reportes
    if (!idsObtenidas.has(4) || !idsObtenidas.has(5) || !idsObtenidas.has(13)) {
        try {
            const reportes = await db.get(`SELECT COUNT(*) as total FROM Reporte_semanal`);
            const totalReportes = reportes?.total ?? 0;

            if (!idsObtenidas.has(4) && totalReportes >= 1) {
                await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 4]);
                nuevosLogrosIds.push(4);
            }
            if (!idsObtenidas.has(5) && totalReportes >= 2) {
                await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 5]);
                nuevosLogrosIds.push(5);
            }
            if (!idsObtenidas.has(13) && totalReportes >= 4) {
                await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 13]);
                nuevosLogrosIds.push(13);
            }
        } catch (error) {
            console.error("La tabla Reporte_semanal no se pudo evaluar para logros.", error);
        }
    }

    // --- REGLA 6: Coleccionista (Id_recompensa: 6) ---
    if (!idsObtenidas.has(6) && eventoEspecial === 'EXPLORACION_TOTAL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 6]);
        nuevosLogrosIds.push(6);
    }

    // --- REGLA 7: Salvado (Id_recompensa: 7) ---
    if (!idsObtenidas.has(7) && eventoEspecial === 'DESCARGA_PERFIL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 7]);
        nuevosLogrosIds.push(7);
    }

    // --- REGLA 8: Imparable (Id_recompensa: 8) ---
    if (!idsObtenidas.has(8)) {
        const conteoActividades = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteoActividades?.total ?? 0) >= 50) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 8]);
            nuevosLogrosIds.push(8);
        }
    }

    // --- REGLA 9: Lechuza (Id_recompensa: 9) ---
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

    // --- REGLA 10: Gestor (Id_recompensa: 10) ---
    if (!idsObtenidas.has(10) && eventoEspecial === 'VISITA_PROGRESO') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 10]);
        nuevosLogrosIds.push(10);
    }

    // --- REGLA 11: Integral (Id_recompensa: 11) ---
    // Verifica si la cantidad de tipos únicos usados en Actividad es igual al total en Tipo_actividad
    if (!idsObtenidas.has(11)) {
        try {
            const cruzadoTipos = await db.get(`
                SELECT 
                    (SELECT COUNT(DISTINCT id_tipo) FROM Actividad) as tiposUsados,
                    (SELECT COUNT(id_tipo) FROM Tipo_actividad) as tiposTotales
            `);
            
            if (cruzadoTipos && cruzadoTipos.tiposTotales > 0 && cruzadoTipos.tiposUsados >= cruzadoTipos.tiposTotales) {
                await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 11]);
                nuevosLogrosIds.push(11);
            }
        } catch (error) {
            console.error("Error al evaluar el logro Integral:", error);
        }
    }

    // --- REGLA 12: Evolución (Id_recompensa: 12) ---
    if (!idsObtenidas.has(12) && eventoEspecial === 'EDICION_PERFIL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 12]);
        nuevosLogrosIds.push(12);
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