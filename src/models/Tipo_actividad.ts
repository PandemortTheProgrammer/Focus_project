export default class Tipo_actividad {
    public id_tipo: number;
    public nombre_tipo: string;
    public utilidad_objetiva: number;

    constructor(id_tipo: number, nombre_tipo: string, utilidad_objetiva: number) {
        this.id_tipo = id_tipo;
        this.nombre_tipo = nombre_tipo;
        this.utilidad_objetiva = utilidad_objetiva;
    }
}