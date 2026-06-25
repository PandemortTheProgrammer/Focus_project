import initSqlJs, { type Database } from 'sql.js';
// 1. Importamos la URL directa del archivo usando el sufijo "?url" de Vite
import wasmUrl from '/sql-wasm.wasm?url'; 

let dbInstance: Database | null = null;

export const inicializarBaseDeDatos = async (): Promise<Database> => {
  if (dbInstance) return dbInstance;

  try {
    const SQL = await initSqlJs({
      // 2. En lugar de armar el string manualmente, le pasamos la URL resuelta por Vite
      locateFile: () => wasmUrl,
    });
    
    dbInstance = new SQL.Database();
    console.log("¡SQLite (sql.js) inicializado con éxito en memoria!");
    
    ejecutarPruebaDeConcepto(dbInstance);

    return dbInstance;
  } catch (error) {
    console.error("Error crítico al inicializar SQLite:", error);
    throw error;
  }
};

const ejecutarPruebaDeConcepto = (db: Database) => {
  db.run("CREATE TABLE IF NOT EXISTS prueba (id INTEGER PRIMARY KEY, texto TEXT);");
  db.run("INSERT INTO prueba (texto) VALUES ('¡La base de datos local funciona!');");
  
  const resultado = db.exec("SELECT * FROM prueba;");
  console.log("Resultado de la consulta de prueba:", resultado[0].values);
};