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
                Utilidad_objet INTEGER CHECK(Utilidad_objet <= 5)
            );
        `);

        // ==========================================
        // 2. CREACIÓN DE TABLAS DEPENDIENTES
        // ==========================================

        await dbInstance.exec(`
            CREATE TABLE IF NOT EXISTS Perfil (
                Id_perfil INTEGER PRIMARY KEY AUTOINCREMENT,
                nickname VARCHAR(20) NOT NULL,
                rango_edad VARCHAR(15) NOT NULL,
                Id_enfoque INTEGER,
                FOREIGN KEY (Id_enfoque) REFERENCES Enfoque(Id_enfoque) ON DELETE SET NULL
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
        `);

        // ==========================================
        // 3. POBLAR CATÁLOGOS (SEEDING)
        // ==========================================
        // Si las tablas están vacías, insertamos los datos base para que el Frontend no se rompa
        const tiposExisten = await dbInstance.get("SELECT COUNT(*) as count FROM Tipo_actividad");
        if (tiposExisten.count === 0) {
            await dbInstance.exec(`
                INSERT INTO Tipo_actividad (Nombre_activ, Utilidad_objet) VALUES 
                ('Estudio', 5), ('Dormir', 5), ('Ejercicio', 4), ('Lectura', 4), ('Trabajo', 3), ('Deporte', 3), ('Series o Películas', 2), ('Música', 2), ('Redes sociales', 1);
                
                INSERT INTO Enfoque (nombre_enf, descrip_enf) VALUES 
                ('Académico', 'Prioriza actividades de estudio y aprendizaje'), 
                ('Tiempo libre', 'Prioriza recuperar tiempo libre en una vida ajetreada'),
                ('Atlético', 'Prioriza actividades que conlleven ejercicio'),
                ('Económico', 'Prioriza actividades que te ofrezcan algún beneficio económico'),
                ('Equilibrado', 'Balance entre trabajo, salud y descanso');
            `);
            console.log("Catálogos iniciales insertados.");
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