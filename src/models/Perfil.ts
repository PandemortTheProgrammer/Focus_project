//superclass 
export default class Perfil {
    public id_perfil: number;
    public nickname:string;
    public age_rank: string;
    public id_focus: number;
    public genero: string;
    public id_icono: number;

    constructor(
        id_perfil: number = 1,
        nickname: string = '',
        age_rank: string = '',
        id_focus: number = 0,
        genero: string = '',
        id_icono: number = 0
    ) {
        this.id_perfil = id_perfil;
        this.nickname = nickname;
        this.age_rank = age_rank;
        this.id_focus = id_focus;
        this.genero = genero;
        this.id_icono = id_icono;
    }
}