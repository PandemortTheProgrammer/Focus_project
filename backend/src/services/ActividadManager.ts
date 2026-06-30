import Actividad from "../models/Actividad";

export default class ActividadManager {
    private actividades: Actividad[] = [];
    
    constructor() {
        this.actividades.push(new Actividad(1, 1, "14:00", 20, "Se realizó X a las 14 hrs para N"));
    }
    
    obteneractividades(): Actividad[] {
        return this.actividades;
    }
    
    agregarActividad(actividad: Actividad): void {
        this.actividades.push(actividad);
    }

    eliminarActividad(id_actividad: number): void {
        this.actividades = this.actividades.filter(actividad => actividad.id_actividad !== id_actividad);
    }
}