export default class Usuario {
    public nickname:string;
    public age_rank: string;
    public focus: string;

    constructor(nickname:string, age_rank:string, focus:string){
        this.nickname = nickname;
        this.age_rank = age_rank;
        this.focus = focus;
    }

    /**
     * age_rank_rules
     */
    public age_rank_rules(): string {
        switch(this.age_rank){
            case "14-16":
                return "Recomendado: actividades ligeras y sesiones cortas (30–45 min).";
            case "17-19":
                return "Recomendado: sesiones moderadas con descansos regulares (45–60 min).";
            case "20-22":
                return "Recomendado: sesiones más largas y metas concretas (60–90 min).";
            default:
                return "Rango de edad desconocido: ajusta según preferencias personales.";
        }
    }
}