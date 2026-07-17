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
        console.log("🟢 Base de Datos SQLite conectada con éxito.");

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

            -- NUEVO: Catálogo de Íconos (Recursos visuales)
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

            -- NUEVO: Catálogo de Recompensas (Depende de Icono)
            CREATE TABLE IF NOT EXISTS Recompensa (
                Id_recompensa INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_recompensa VARCHAR(50) NOT NULL,
                descripcion VARCHAR(150),
                tipo_recompensa VARCHAR(20) NOT NULL, -- Ej: 'ICONO'
                Id_icono INTEGER,
                FOREIGN KEY (Id_icono) REFERENCES Icono(Id_icono) ON DELETE SET NULL
            );

            -- NUEVO: Tabla Relacional (El puente N:M entre Perfil y Recompensa)
            CREATE TABLE IF NOT EXISTS Perfil_Recompensa (
                Id_perfil INTEGER,
                Id_recompensa INTEGER,
                fecha_obtencion DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (Id_perfil, Id_recompensa),
                FOREIGN KEY (Id_perfil) REFERENCES Perfil(Id_perfil) ON DELETE CASCADE,
                FOREIGN KEY (Id_recompensa) REFERENCES Recompensa(Id_recompensa) ON DELETE CASCADE
            );
        `);

        // Migración compatible con bases de datos ya existentes que no tengan las columnas nuevas o antiguas
        try {
            await dbInstance.exec(`ALTER TABLE Perfil ADD COLUMN Id_icono INTEGER DEFAULT 1;`);
        } catch {
            // La columna ya existe, no hay nada que hacer
        }

        try {
            await dbInstance.exec(`ALTER TABLE Perfil ADD COLUMN icono VARCHAR(60);`);
        } catch {
            // La columna ya existe, no hay nada que hacer
        }

        await dbInstance.run(`
            INSERT OR IGNORE INTO Icono (Id_icono, nombre_icono)
            VALUES (1, 'Sin icono (usar inicial)')
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
        // 3. POBLAR CATÁLOGOS (SEEDING)
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
            console.log("Catálogos iniciales insertados.");
        }

        // NUEVO SEEDING: Íconos y Recompensas Iniciales
        const iconosExisten = await dbInstance.get("SELECT COUNT(*) as count FROM Icono");
        if (iconosExisten.count === 0) {
            await dbInstance.exec(`
                INSERT INTO Icono (nombre_icono) VALUES 
                ('Sin icono (usar inicial)'),
                ('Espíritu Novato'), 
                ('Primeros pasos'), 
                ('Maratonista'),
                ('Reflexivo'),
                ('Maestro del Tiempo'),
                ('Ícono Secreto');

                INSERT INTO Recompensa (nombre_recompensa, descripcion, tipo_recompensa, Id_icono) VALUES 
                ('Bienvenida', 'Tu primer perfil en Focus', 'ICONO', 1),
                ('Iniciador', 'Registraste tu primera actividad', 'ICONO', 2),
                ('Constancia', 'Alcanzaste 10 horas de actividades', 'ICONO', 3),
                ('Analista', 'Revisaste tu primer reporte semanal', 'ICONO', 4),
                ('Veterano', 'Llegaste a tu cuarta semana usando Focus', 'ICONO', 5),
                ('Coleccionista', 'Exploraste todas las funciones de la aplicación', 'ICONO', 6);
            `);
            console.log("Catálogo de Íconos y Recompensas inicializado.");
        }

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