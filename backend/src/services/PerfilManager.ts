import Perfil from "../models/Perfil";

export default class PerfilesManager {
    private perfiles: Perfil[] = [];

    constructor() {
        this.perfiles.push(new Perfil(1, "Sparkleshowdown", "14-16", 1));
    }

    agregarPerfil(perfil: Perfil): void {
        this.perfiles.push(perfil);
    }

    eliminarPerfil(id_perfil: number): void {
        this.perfiles = this.perfiles.filter(perfil => perfil.id_perfil !== id_perfil);
    }
}