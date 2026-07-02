// backend/src/services/ActividadManager.ts
import Actividad from '../models/Actividad';
import Tipo_actividad from '../models/Tipo_actividad';

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

// Usamos 'let' en lugar de 'const' para poder sobrescribir el arreglo al eliminar
export let listaActividades: Actividad[] = [];

export const registrarActividad = (datos: any): Actividad => {
    // Generamos un ID simple sumando 1 a la longitud actual
    const nuevoId = listaActividades.length > 0 
        ? Math.max(...listaActividades.map(a => a.id_actividad)) + 1 
        : 1;

    const nuevaActividad = new Actividad(
        nuevoId,
        parseInt(datos.id_tipo),
        datos.hora_inicio,
        datos.duracion_minutos,
        datos.descripcion_actividad
    );
    
    listaActividades.push(nuevaActividad);
    return nuevaActividad;
};

export const eliminarActividad = (id: number): void => {
    // Filtramos el arreglo para dejar todas las actividades MENOS la que coincida con el ID
    listaActividades = listaActividades.filter(act => act.id_actividad !== id);
};