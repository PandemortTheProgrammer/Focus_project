export default class Enfoque {
    public id_enfoque: number;
    public nombre_enfoque: string;
    public descripcion_enfoque: string;
    constructor(id_enfoque: number, nombre_enfoque: string, descripcion_enfoque: string) {
        this.id_enfoque = id_enfoque;
        this.nombre_enfoque = nombre_enfoque;
        this.descripcion_enfoque = descripcion_enfoque;
    }
}