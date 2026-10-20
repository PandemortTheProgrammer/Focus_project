export default class Recompensa {
    public id_recompensa: number;
    public nombre_recompensa: string;
    public descripcion: string;
    public tipo_recompensa: string;
    public id_desbloqueado?: number;

    constructor(id_recompensa: number, nombre_recompensa: string, descripcion: string, tipo_recompensa: string, id_desbloqueado?: number) {
        this.id_recompensa = id_recompensa;
        this.nombre_recompensa = nombre_recompensa;
        this.descripcion = descripcion;
        this.tipo_recompensa = tipo_recompensa;
        this.id_desbloqueado = id_desbloqueado;
    }
}
