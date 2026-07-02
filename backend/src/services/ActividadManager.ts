import Actividad from '../models/Actividad';
import Tipo_actividad from '../models/Tipo_actividad';

// Tipos de Actividad
export const catalogoTipos: Tipo_actividad[] = [
    new Tipo_actividad(1, "Estudiar", 5),
    new Tipo_actividad(2, "Dormir", 5),
    new Tipo_actividad(3, "Hacer Ejercicio", 4),
    new Tipo_actividad(4, "Leer", 4),
    new Tipo_actividad(5, "Trabajar", 3),
    new Tipo_actividad(6, "Jugar algún deporte", 2),
    new Tipo_actividad(7, "Ver series o películas", 2),
    new Tipo_actividad(8, "Escuchar música", 2),
    new Tipo_actividad(9, "Navegar en redes sociales", 1),
];

export const listaActividades: Actividad[] = [];

// Función POST (que usarás en routes/focusRoutes.ts)
export const registrarActividad = (datos: any): Actividad => {
    const nuevaActividad = new Actividad(
        listaActividades.length + 1,      // id_actividad autoincremental
        parseInt(datos.id_tipo),          // id_tipo que viene del select de React
        datos.hora_inicio,                // hora_inicio
        datos.duracion_minutos,           // duracion_minutos
        datos.descripcion_actividad       // descripcion_actividad
    );
    
    // Las fechas ya se asignaron solas por tu constructor (new Date())
    listaActividades.push(nuevaActividad);
    console.log("Nueva actividad en memoria:", nuevaActividad);
    
    return nuevaActividad;
};

// Función GET
export const obtenerActividades = (): Actividad[] => {
    return listaActividades;
};
