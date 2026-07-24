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

    // --- REGLAS 1 a 12 (Se mantienen exactamente igual) ---
    if (!idsObtenidas.has(1)) {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 1]);
        nuevosLogrosIds.push(1);
    }
    if (!idsObtenidas.has(2)) {
        const conteo = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteo?.total ?? 0) >= 1) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 2]);
            nuevosLogrosIds.push(2);
        }
    }
    if (!idsObtenidas.has(3)) {
        const horas = await db.get(`SELECT SUM(durac_min) as totalMinutos FROM Actividad`);
        if ((horas?.totalMinutos ?? 0) >= 600) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 3]);
            nuevosLogrosIds.push(3);
        }
    }
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
        } catch (error) { console.error("Error en tabla Reporte_semanal:", error); }
    }
    if (!idsObtenidas.has(6) && eventoEspecial === 'EXPLORACION_TOTAL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 6]);
        nuevosLogrosIds.push(6);
    }
    if (!idsObtenidas.has(7) && eventoEspecial === 'DESCARGA_PERFIL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 7]);
        nuevosLogrosIds.push(7);
    }
    if (!idsObtenidas.has(8)) {
        const conteo = await db.get(`SELECT COUNT(*) as total FROM Actividad`);
        if ((conteo?.total ?? 0) >= 50) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 8]);
            nuevosLogrosIds.push(8);
        }
    }
    if (!idsObtenidas.has(9)) {
        const nocturna = await db.get(`SELECT 1 FROM Actividad WHERE hora_inicio >= '00:00' AND hora_inicio <= '04:00' LIMIT 1`);
        if (nocturna) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 9]);
            nuevosLogrosIds.push(9);
        }
    }
    if (!idsObtenidas.has(10) && eventoEspecial === 'VISITA_PROGRESO') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 10]);
        nuevosLogrosIds.push(10);
    }
    if (!idsObtenidas.has(11)) {
        try {
            const cruzadoTipos = await db.get(`SELECT (SELECT COUNT(DISTINCT id_tipo) FROM Actividad) as tiposUsados, (SELECT COUNT(id_tipo) FROM Tipo_actividad) as tiposTotales`);
            if (cruzadoTipos && cruzadoTipos.tiposTotales > 0 && cruzadoTipos.tiposUsados >= cruzadoTipos.tiposTotales) {
                await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 11]);
                nuevosLogrosIds.push(11);
            }
        } catch (error) {}
    }
    if (!idsObtenidas.has(12) && eventoEspecial === 'EDICION_PERFIL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 12]);
        nuevosLogrosIds.push(12);
    }

    // --- NUEVAS REGLAS (14 a 18) ---

    // REGLA 14: ¿Ha pasado un año?
    if (!idsObtenidas.has(14)) {
        try {
            // Busca la fecha más antigua en los registros de actividades
            const primeraActividad = await db.get(`SELECT MIN(fecha) as fechaInicio FROM Actividad`);
            if (primeraActividad && primeraActividad.fechaInicio) {
                const fechaInicio = new Date(primeraActividad.fechaInicio);
                const hoy = new Date();
                
                // Calcula la diferencia en días
                const diffTime = Math.abs(hoy.getTime() - fechaInicio.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 365) {
                    await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 14]);
                    nuevosLogrosIds.push(14);
                }
            }
        } catch (error) {
            console.error("Error al calcular el año de uso:", error);
        }
    }

    // REGLA 15: Madrugador
    if (!idsObtenidas.has(15)) {
        const madrugador = await db.get(`
            SELECT 1 FROM Actividad 
            WHERE hora_inicio > '04:00' AND hora_inicio <= '07:59' 
            LIMIT 1
        `);
        if (madrugador) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 15]);
            nuevosLogrosIds.push(15);
        }
    }

    // REGLA 16: Un nuevo comienzo
    if (!idsObtenidas.has(16) && eventoEspecial === 'REPORTE_NUEVO_ENFOQUE') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 16]);
        nuevosLogrosIds.push(16);
    }

    // REGLA 17: Recordando viejos tiempos
    if (!idsObtenidas.has(17) && eventoEspecial === 'VISITA_HISTORIAL') {
        await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 17]);
        nuevosLogrosIds.push(17);
    }

    // REGLA 18: Gran Maestro (Debe ir al final de todas las reglas)
    if (!idsObtenidas.has(18)) {
        // Unimos los logros que ya tenía con los que acaba de ganar en esta misma evaluación
        const todosLosLogrosActuales = new Set([...idsObtenidas, ...nuevosLogrosIds]);
        
        let tieneTodos = true;
        for (let i = 1; i <= 17; i++) {
            if (!todosLosLogrosActuales.has(i)) {
                tieneTodos = false;
                break;
            }
        }

        if (tieneTodos) {
            await db.run(`INSERT INTO Perfil_Recompensa (Id_perfil, Id_recompensa) VALUES (?, ?)`, [idPerfil, 18]);
            nuevosLogrosIds.push(18);
        }
    }

    if (nuevosLogrosIds.length === 0) {
        return [];
    }

    const placeholders = nuevosLogrosIds.map(() => '?').join(',');
    // NOTA: Recuerda que aquí ya usamos r.Id_icono para evitar el error de imágenes rotas
    const query = `
        SELECT r.Id_recompensa, r.nombre_recompensa, r.descripcion, r.tipo_recompensa, r.Id_icono, i.nombre_icono
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
        Id_icono: row.Id_icono,
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