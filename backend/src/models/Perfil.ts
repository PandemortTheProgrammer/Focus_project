//superclass 
export default class Perfil {
    public id_perfil: number;
    public nickname:string;
    public age_rank: string;
    public id_focus: number;
    public genero: string;
    public Id_icono: number;
    constructor(id_perfil:number, nickname:string, age_rank:string, id_focus:number, genero:string, Id_icono: number) {
        this.id_perfil = id_perfil;
        this.nickname = nickname;
        this.age_rank = age_rank;
        this.id_focus = id_focus;
        this.genero = genero;
        this.Id_icono = Id_icono;
    }

}