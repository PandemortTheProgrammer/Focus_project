export default class Rep_semanal {
    public id_reporte: number;
    public id_enfoque: number;
    public fecha_inicio_semana: Date;
    public fecha_fin_semana: Date;
    public Conclusion: string;
    public Progreso_optimizacion: number;
    
    constructor(id_reporte: number, id_enfoque: number, fecha_inicio_semana: Date, fecha_fin_semana: Date, Conclusion: string, Progreso_optimizacion: number) {
        this.id_reporte = id_reporte;
        this.id_enfoque = id_enfoque;
        this.fecha_inicio_semana = fecha_inicio_semana;
        this.fecha_fin_semana = fecha_fin_semana;
        this.Conclusion = Conclusion;
        this.Progreso_optimizacion = Progreso_optimizacion;
    }
}