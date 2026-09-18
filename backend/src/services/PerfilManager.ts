// backend/src/services/PerfilManager.ts
import { getDB } from '../config/db';

export const obtenerEnfoques = async (): Promise<{ id: number; nombre: string }[]> => {
    const db = getDB();
    return await db.all("SELECT * FROM Enfoque");
};
// --- NUEVO: Diccionario de recomendaciones estáticas para la V2 ---
const recomendacionesPorEnfoque: Record<number, string[]> = {
    1: [ // Académico
        "Prioriza al menos 2 horas diarias de estudio ininterrumpido (bloques de 45 mins).",
        "Limita el tiempo de 'Redes sociales' a menos de 1 hora diaria.",
        "Considera realizar 'Descanso activo' entre tus sesiones de estudio largo."
    ],
    2: [ // Tiempo libre
        "Tu objetivo es apilar tareas obligatorias en pocos bloques para liberar tus tardes.",
        "Asegúrate de registrar al menos una actividad de 'Ocio' o 'Hobby' al día.",
        "No superes las 8 horas laborales; desconecta por completo."
    ],
    3: [ // Atlético
        "Registra al menos 1 hora de 'Actividad física' diaria o interdiaria.",
        "Asegura tus 8 horas de 'Dormir' (Nivel 0) para recuperación muscular.",
        "Prioriza la 'Planificación de actividades' para preparar tus rutinas o comidas."
    ],
    4: [ // Económico
        "Prioriza tus horas en 'Trabajo' o 'Proyecto personal' de alto rendimiento.",
        "Agrupa tus 'Trámites' en un solo día para no fragmentar tu semana productiva.",
        "Cuidado con el 'Burnout': si superas las 50 horas semanales, a largo plazo podrías reducir tu rendimiento."
    ],
    5: [ // Salud mental y descanso
        "Tu prioridad no es hacer más, sino hacer mejor. Limita las actividades de estrés.",
        "Registra al menos 20 minutos de 'Meditación' o 'Autocuidado' diario.",
        "Asegúrate de tener un bloque de 'Socializar' o 'Familia' para tu bienestar emocional."
    ],
    6: [ // Flexibilidad
        "No te obsesiones con los bloques rígidos; permite que tu día varíe.",
        "Usa las actividades de 'Fondo' (música, podcast) para hacer amenas tus tareas.",
        "Si un día es improductivo, compénsalo suavemente al día siguiente sin culpas."
    ],
    7: [ // Equilibrado
        "Apunta a la regla de los tercios: 8h descanso, 8h trabajo/estudio, 8h ocio/rutina.",
        "Intenta que ningún tipo de actividad acapare más del 40% de tu semana.",
        "Mantén una mezcla saludable entre actividades prioritarias y de ocio menor."
    ]
};

export const obtenerDetallesEnfoque = async (idEnfoque: number) => {
    const db = getDB();
    const enfoqueDB = await db.get("SELECT Id_enfoque, nombre_enf, descrip_enf FROM Enfoque WHERE Id_enfoque = ?", [idEnfoque]);
    
    if (!enfoqueDB) return null;

    return {
        Id_enfoque: enfoqueDB.Id_enfoque,
        nombre_enf: enfoqueDB.nombre_enf,
        // Usamos la descripción de la BD como descripción larga
        descripcion_larga: enfoqueDB.descrip_enf, 
        // Acoplamos las recomendaciones del diccionario (o un array vacío si no existe el ID)
        recomendaciones: recomendacionesPorEnfoque[idEnfoque] || [
            "Registra tus actividades constantemente para que el sistema te conozca mejor."
        ]
    };
};

// backend/src/services/PerfilManager.ts
export const actualizarPin = async (nuevoPin: string | null): Promise<void> => {
    const db = getDB();
    // Guardamos el PIN (o NULL si el usuario decide quitarlo)
    await db.run("UPDATE Perfil SET pin = ? WHERE Id_perfil = 1", [nuevoPin]);
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
export const obtenerPerfil = async (): Promise<{ id: number; nickname: string; rango_edad: string; Id_enfoque: number; genero: string; Id_icono: number | null; pin: string | null } | null> => {
    const db = getDB();
    const query = `SELECT * FROM Perfil LIMIT 1`;
    const perfil = await db.get(query);
    return perfil;
};

export const reiniciarPerfilYDatos = async (): Promise<void> => {
    const db = getDB();
    
    // Iniciamos una transacción segura
    await db.run('BEGIN TRANSACTION');
    try {
        // Borramos las tablas del usuario dependientes primero (por las llaves foráneas)
        await db.run('DELETE FROM Perfil_Recompensa');
        await db.run('DELETE FROM Reporte_semanal');
        await db.run('DELETE FROM Actividad');
        
        // Finalmente borramos el perfil
        await db.run('DELETE FROM Perfil');

        // Opcional: Reiniciamos los contadores de los IDs automáticos para que vuelvan a empezar en 1
        await db.run('DELETE FROM sqlite_sequence WHERE name IN ("Actividad", "Reporte_semanal")');

        await db.run('COMMIT');
        console.log("🧹 Base de datos reiniciada con éxito. Lista para un nuevo perfil.");
    } catch (error) {
        await db.run('ROLLBACK');
        console.error("Error al reiniciar la base de datos:", error);
        throw error;
    }
};

export const actualizarEnfoque = async (idEnfoque: number): Promise<void> => {
    const db = getDB();
    await db.run("UPDATE Perfil SET Id_enfoque = ? WHERE Id_perfil = 1", [idEnfoque]);
};