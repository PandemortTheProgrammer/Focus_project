export default class Recompensa_perfil {
    public id_perfil: number;
    public id_recompensa: number;
    public fecha_obtencion: Date;

    constructor(id_perfil: number, id_recompensa: number, fecha_obtencion: Date = new Date()) {
        this.id_perfil = id_perfil;
        this.id_recompensa = id_recompensa;
        this.fecha_obtencion = fecha_obtencion;
    }
}
