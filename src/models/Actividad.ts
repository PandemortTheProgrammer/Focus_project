export default class Actividad {
    public id_actividad: number;
    public id_tipo: number;
    public hora_inicio: string;
    public duracion_minutos: number;
    public descripcion_actividad: string;
    public fecha : Date;
    public hora_creacion: Date;
    //public inicio: datetime;
    constructor(id_actividad: number, id_tipo: number, hora_inicio: string, duracion_minutos: number, descripcion_actividad: string) {
        this.id_actividad = id_actividad;
        this.id_tipo = id_tipo;
        this.hora_inicio = hora_inicio;
        this.duracion_minutos = duracion_minutos;
        this.descripcion_actividad = descripcion_actividad;
        this.fecha = new Date();
        this.hora_creacion = new Date();
    }
}