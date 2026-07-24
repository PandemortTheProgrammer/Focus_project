import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let dbInstance: Database | null = null;

export const inicializarBD = async () => {
    if (dbInstance) return dbInstance;

    try {
        dbInstance = await open({
            filename: './focus_database.sqlite',
            driver: sqlite3.Database
        });

        // Habilitar Llaves Foráneas (SQLite las trae apagadas por defecto)
        await dbInstance.exec('PRAGMA foreign_keys = ON;');
        console.log("Base de Datos SQLite conectada con éxito.");

        // ==========================================
        // 1. CREACIÓN DE TABLAS INDEPENDIENTES
        // ==========================================
        
        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS Enfoque (
                Id_enfoque INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_enf VARCHAR(20) NOT NULL,
                descrip_enf VARCHAR(120)
            );

            CREATE TABLE IF NOT EXISTS Tipo_actividad (
                Id_tipo INTEGER PRIMARY KEY AUTOINCREMENT,
                Nombre_activ VARCHAR(20) NOT NULL,
                Utilidad_objet INTEGER CHECK(Utilidad_objet <= 5),
                Codigo_color VARCHAR(7) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS Icono (
                Id_icono INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_icono VARCHAR(50) NOT NULL
            );
        `);

        // ==========================================
        // 2. CREACIÓN DE TABLAS DEPENDIENTES
        // ==========================================

        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS Perfil (
                Id_perfil INTEGER PRIMARY KEY,
                nickname VARCHAR(20) NOT NULL,
                rango_edad VARCHAR(15) NOT NULL,
                Id_enfoque INTEGER,
                genero VARCHAR(1) NOT NULL,
                Id_icono INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (Id_enfoque) REFERENCES Enfoque(Id_enfoque) ON DELETE SET NULL,
                FOREIGN KEY (Id_icono) REFERENCES Icono(Id_icono) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS Actividad (
                Id_actividad INTEGER PRIMARY KEY AUTOINCREMENT,
                Id_tipo INTEGER NOT NULL,
                desc_activ VARCHAR(255),
                fecha DATE DEFAULT CURRENT_DATE,
                hora_inicio VARCHAR(5) NOT NULL,
                durac_min INTEGER CHECK(durac_min < 1440),
                hora_creac DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (Id_tipo) REFERENCES Tipo_actividad(Id_tipo) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Reporte_semanal (
                Id_reporte INTEGER PRIMARY KEY AUTOINCREMENT,
                Id_enfoque INTEGER NOT NULL,
                Fecha_i_semana DATE,
                Fecha_f_semana DATE,
                Conclusion VARCHAR(255),
                Prog_optimizac INTEGER CHECK(Prog_optimizac <= 100),
                FOREIGN KEY (Id_enfoque) REFERENCES Enfoque(Id_enfoque) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS Recompensa (
                Id_recompensa INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_recompensa VARCHAR(50) NOT NULL,
                descripcion VARCHAR(150),
                tipo_recompensa VARCHAR(20) NOT NULL,
                Id_icono INTEGER,
                FOREIGN KEY (Id_icono) REFERENCES Icono(Id_icono) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS Perfil_Recompensa (
                Id_perfil INTEGER,
                Id_recompensa INTEGER,
                fecha_obtencion DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (Id_perfil, Id_recompensa),
                FOREIGN KEY (Id_perfil) REFERENCES Perfil(Id_perfil) ON DELETE CASCADE,
                FOREIGN KEY (Id_recompensa) REFERENCES Recompensa(Id_recompensa) ON DELETE CASCADE
            );
        `);

        try {
            const perfilActual = await dbInstance.get("SELECT Id_icono, icono FROM Perfil LIMIT 1");
            if (perfilActual && (perfilActual.Id_icono === null || perfilActual.Id_icono === 0) && perfilActual.icono) {
                const idExtraido = parseInt(String(perfilActual.icono).match(/\d+/)?.[0] ?? '1', 10);
                await dbInstance.run("UPDATE Perfil SET Id_icono = ? WHERE Id_perfil = 1", [Number.isNaN(idExtraido) ? 1 : idExtraido]);
            }
        } catch {
            // Ignoramos si la columna vieja no existe
        }

        // ==========================================
        // 3. POBLAR CATÁLOGOS (Tipos y Enfoques)
        // ==========================================
        
        const tiposExisten = await dbInstance.get("SELECT COUNT(*) as count FROM Tipo_actividad");
        if (tiposExisten.count === 0) {
            await dbInstance.exec(`
                INSERT INTO Tipo_actividad (Nombre_activ, Utilidad_objet, Codigo_color) VALUES 
                ('Comer', 5, '#eab308'), 
                ('Expresión artística', 3, '#f97316'), 
                ('Cuidado de mascotas', 4, '#ed75ff'), 
                ('Realizar un trámite', 2, '#1f7b71'), 
                ('Planificación de actividades', 4, '#4c9088'), 
                ('Familia', 5, '#b227c7'), 
                ('Pareja', 5, '#9624a7'), 
                ('Higiene personal', 5, '#f5d986'), 
                ('Meditación', 3, '#1352b8'), 
                ('Transporte', 4, '#759692'), 
                ('Socializar', 3, '#d233eb'), 
                ('Tareas del hogar', 4, '#275751'), 
                ('Ir de Compras (ocio)', 2, '#ff987a'), 
                ('Hacer el mandado', 4, '#135850'), 
                ('Ir al médico', 5, '#81734a'), 
                ('Autocuidado', 4, '#d946ef'), 
                ('Proyecto personal', 5, '#008575'), 
                ('Descanso activo', 3, '#0062ff'), 
                ('Estudio', 5, '#1a7a6e'), 
                ('Dormir', 5, '#3b82f6'), 
                ('Actividad física', 4, '#872d95'), 
                ('Lectura', 4, '#bb570f'), 
                ('Trabajo', 3, '#20ab9a'), 
                ('Series o Películas', 2, '#7062ef'), 
                ('Música', 2, '#ff987a'), 
                ('Videojuegos', 1, '#8b7fef'), 
                ('Redes sociales', 1, '#6d6999');
                
                INSERT INTO Enfoque (nombre_enf, descrip_enf) VALUES 
                ('Académico', 'Prioriza actividades de estudio y aprendizaje'), 
                ('Tiempo libre', 'Prioriza recuperar tiempo libre en una vida ajetreada'),
                ('Atlético', 'Prioriza actividades que conlleven ejercicio'),
                ('Económico', 'Prioriza actividades que te ofrezcan algún beneficio económico'),
                ('Salud mental y descanso', 'Prioriza actividades que te ofrezcan tranquilidad emocional y mejora en tu calidad de vida'),
                ('Flexibilidad', 'Prioriza desarrollar tus actividades de manera que te permitan adaptarte a cambios y situaciones imprevistas'),
                ('Equilibrado', 'Balance entre trabajo, salud y descanso');
            `);
            console.log("Catálogos de Actividades y Enfoques insertados.");
        }

        // ==========================================
        // 4. ACTUALIZACIÓN AUTOMÁTICA DE ÍCONOS Y RECOMPENSAS
        // Usamos INSERT OR IGNORE indicando el ID exacto. 
        // Si el usuario ya tiene ese ID en su BD, lo ignora. Si no lo tiene, lo añade.
        // ==========================================

        await dbInstance.exec(`
            INSERT OR IGNORE INTO Icono (Id_icono, nombre_icono) VALUES 
            (1, 'Sin icono (usar inicial)'),
            (2, 'Espíritu Novato'), 
            (3, 'Lighty Realista'), 
            (4, 'Maratonista'),
            (5, 'Reflexivo'),
            (6, 'Maestro del Tiempo'),
            (7, 'Dark Lighty'),
            (8, 'Lighty'),
            (9, 'Medalla Dorada'),
            (10, 'Lechuza Coronada'),
            (11, '¿Eso es una ciudad?'),
            (12, 'Coleccionista'),
            (13, 'Mariposa'),
            (14, 'Anne'),
            (15, 'Reloj de Arena'),
            (16, 'Sonámbulo'),
            (17, 'Joven'),
            (18, 'Sabio'),
            (19, 'Ganador');

            INSERT OR IGNORE INTO Recompensa (Id_recompensa, nombre_recompensa, descripcion, tipo_recompensa, Id_icono) VALUES 
            (1, 'Bienvenida', 'Tu primer perfil en Focus', 'ICONO', 2),
            (2, 'Iniciador', 'Registraste tu primera actividad', 'ICONO', 3),
            (3, 'Registrador', 'Alcanzaste 10 horas de actividades', 'ICONO', 4),
            (4, 'Analista', 'Revisaste tu primer reporte semanal', 'ICONO', 5),
            (5, 'Y este es solo el segundo', 'Recibiste tu segundo reporte semanal', 'ICONO', 6),
            (6, 'Coleccionista', 'Exploraste todas las funciones de la aplicación', 'ICONO', 7),
            (7, 'Salvado', 'Descargaste tu perfil por primera vez', 'ICONO', 8),
            (8, 'Imparable', 'Registraste 50 actividades en la plataforma', 'ICONO', 9),
            (9, 'Lechuza', 'Registraste una actividad después de medianoche', 'ICONO', 10),
            (10, 'Gestor', 'Visita tu progreso semanal por primera vez', 'ICONO', 11),
            (11, 'Integral', 'Registra una actividad de cada tipo al menos una vez', 'ICONO', 12),
            (12, 'Evolución', 'Edita tu perfil por primera vez', 'ICONO', 13),
            (13, 'Constante', 'Recibe 4 reportes semanales', 'ICONO', 14),
            (14, '¿Ha pasado un año?', 'Ha pasado un año, si', 'ICONO', 15),
            (15, 'Madrugador', 'Registraste una actividad tan pronto iniciaste tu día', 'ICONO', 16),
            (16, 'Un nuevo comienzo', 'Recibe el primer reporte semanal bajo un nuevo enfoque', 'ICONO', 17),
            (17, 'Recordando viejos tiempos', 'Exploraste tu historial de actividades por primera vez', 'ICONO', 18),
            (18, 'Gran Maestro de los logros (de la versión 1)', 'Conseguiste todos los logros de Focus (v1)', 'ICONO', 19);
            
        `);
        console.log("Catálogo de Íconos y Recompensas verificado/actualizado.");

        return dbInstance;
    } catch (error) {
        console.error("Error al inicializar la base de datos:", error);
        throw error;
    }
};

export const getDB = () => {
    if (!dbInstance) throw new Error("La BD no ha sido inicializada");
    return dbInstance;
};

export const cerrarBD = async (): Promise<void> => {
    if (dbInstance) {
        try {
            await dbInstance.close();
            dbInstance = null;
            console.log("🔴 Conexión a SQLite cerrada temporalmente para reemplazo.");
        } catch (error) {
            console.error("Error al intentar cerrar la base de datos:", error);
            throw error;
        }
    }
};

/*

*/