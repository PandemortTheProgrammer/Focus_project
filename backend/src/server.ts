import app from './app'; // Tu archivo app.ts actual
import { inicializarBD } from './config/db'; // Importamos el arrancador de la BD

const PORT = 3000;

// Creamos una función asíncrona para controlar el orden de encendido
const arrancarServidor = async () => {
    try {
        // 1. PRIMERO: Esperamos a que SQLite cree el archivo y las tablas
        await inicializarBD();
        
        // 2. SEGUNDO: Una vez que la BD dio luz verde, encendemos Express
        app.listen(PORT, () => {
            console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error(" Error fatal, no se pudo iniciar la aplicación:", error);
    }
};

// Ejecutamos la secuencia
arrancarServidor();