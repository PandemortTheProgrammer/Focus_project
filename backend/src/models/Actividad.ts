export default class Actividad {
    public tag: string;
    public hora_inicio: string;
    public duracion: number;
    public descripcion: string;
    //public inicio: datetime;
    constructor(tag: string, hora_inicio: string, duracion: number, descripcion: string) {
        this.tag = tag;
        this.hora_inicio = hora_inicio;
        this.duracion = duracion;
        this.descripcion = descripcion;
    }
}