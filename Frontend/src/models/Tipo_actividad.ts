export default class Tipo_actividad {
    public id_tipo: number;
    public nombre_tipo: string;
    public utilidad_objetiva: number;
    public codigo_color: string;
    constructor(id_tipo: number, nombre_tipo: string, utilidad_objetiva: number, codigo_color: string) {
        this.id_tipo = id_tipo;
        this.nombre_tipo = nombre_tipo;
        this.utilidad_objetiva = utilidad_objetiva;
        this.codigo_color = codigo_color;
    }
}