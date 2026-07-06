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

export const registrarActividad = (datos: Actividad): Actividad => {
    // Generamos un ID simple sumando 1 a la longitud actual
    const nuevoId = listaActividades.length > 0 
        ? Math.max(...listaActividades.map(a => a.id_actividad)) + 1 
        : 1;

    const nuevaActividad = new Actividad(
        nuevoId,
        datos.id_tipo,
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

export const editarActividad = (id: number, datos: Partial<Actividad>): Actividad | null => {
    const index = listaActividades.findIndex(act => act.id_actividad === id);
    if (index === -1) return null;

    listaActividades[index] = {
        ...listaActividades[index],
        ...datos,
        id_actividad: id // el ID nunca cambia
    };

    return listaActividades[index];
};

export const actividadesSemana = (): Record<string, Actividad[]> => {
    const hoy = new Date();
    const hace7dias = new Date();
    hace7dias.setDate(hoy.getDate() - 6); // últimos 7 días incluyendo hoy

    // Filtra solo las actividades de los últimos 7 días
    const actividadesFiltradas = listaActividades.filter(act => {
        const fechaAct = new Date(act.fecha);
        return fechaAct >= hace7dias && fechaAct <= hoy;
    });

    // Agrupa por fecha (string "YYYY-MM-DD")
    const agrupadas: Record<string, Actividad[]> = {};
    actividadesFiltradas.forEach(act => {
        const clave = new Date(act.fecha).toISOString().split('T')[0];
        if (!agrupadas[clave]) agrupadas[clave] = [];
        agrupadas[clave].push(act);
    });

    return agrupadas;
};