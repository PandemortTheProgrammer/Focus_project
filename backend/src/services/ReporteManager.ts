// backend/src/services/ReportesManager.ts
import { getDB } from '../config/db';
import { evaluarNuevosLogros } from './RecompensasManager';

export interface ActividadConTipoRow {
    id_actividad: number;
    id_tipo: number;
    hora_inicio: string;
    durac_min: number;
    desc_activ: string;
    fecha: string;
    hora_creacion?: string;
    nombre_tipo: string;
    peso: number;
    codigo_color: string;
}

export interface TipoResumenSemanal {
    id_tipo: number;
    nombre_tipo: string;
    peso: number;
    color: string;
    horas: number;
    resumen: string;
    mensaje: string;
}

export interface SemanaResumen {
    numero_semana: number;
    fecha_inicio: string;
    fecha_fin: string;
    total_horas: number;
    total_actividades: number;
    descripcion_general: string;
    actividades: ActividadConTipoRow[];
    tipos: TipoResumenSemanal[];
}

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const getMonday = (date: Date): Date => {
    const copy = new Date(date);
    const day = copy.getUTCDay();
    const diff = (day + 6) % 7; // Lunes = 0, Domingo = 6
    copy.setUTCDate(copy.getUTCDate() - diff);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
};

const generarResumenTipo = (nombreTipo: string, horas: number): string => {
    return `Durante la semana destinaste ${horas.toFixed(1)}h a ${nombreTipo.toLowerCase()}.`;
};

const generarMensajeMotivacional = (peso: number, horas: number): string => {
    if (peso >= 4) {
        if (horas > 5) return 'Excelente dedicación: estás reforzando tus prioridades más importantes.';
        if (horas >= 2) return 'Bien hecho: mantienes una rutina positiva en actividades clave.';
        if (horas >= 0.5) return 'Buen arranque: intenta alargar un poco más estas sesiones para ganar impulso.';
        return 'Alerta leve: dedica un poco más de tiempo a esta actividad prioritaria.';
    }
    if (peso >= 2) {
        if (horas < 3) return 'Equilibrado: estas actividades están en un nivel saludable para apoyar tu semana.';
        if (horas <= 6) return 'Advertencia moderada: controla el tiempo para que no desplace otras tareas importantes.';
        return 'Recomendación: reduce un poco estas horas para evitar sobrecarga de ocio moderado.';
    }
    if (peso === 1) {
        if (horas < 1) return 'Neutral: este ocio menor no está afectando tu equilibrio semanal.';
        if (horas <= 3) return 'Atención: modera estas horas de redes sociales y prioriza otros hábitos.';
        return 'Excesivo: demasiado tiempo en redes sociales. Busca un cambio de ritmo.';
    }
    return 'Sigue observando cómo se integra esta actividad en tu semana.';
};

const generarDescripcionGeneralPorSemana = (actividades: ActividadConTipoRow[]): string => {
    const porPeso = actividades.reduce(
        (acc, actividad) => {
            const horas = Number(actividad.durac_min || 0) / 60;
            if (actividad.peso >= 4) acc.prioritarios += horas;
            else if (actividad.peso >= 2) acc.moderados += horas;
            else acc.menores += horas;
            return acc;
        },
        { prioritarios: 0, moderados: 0, menores: 0 }
    );

    if (porPeso.prioritarios >= 8 && porPeso.menores <= 2) return 'Semana con foco en prioridades: buenas decisiones y avance constante en actividades clave.';
    if (porPeso.menores > porPeso.prioritarios + 2) return 'La semana tuvo más ocio menor de lo ideal; vale la pena realinear el tiempo hacia lo más importante.';
    if (porPeso.moderados > 6) return 'Hay un buen equilibrio, aunque es recomendable ajustar algunas horas de ocio moderado.';
    return 'Buena semana con espacio para seguir mejorando el equilibrio entre rutinas y descanso.';
};

const resumirTiposPorSemana = (actividades: ActividadConTipoRow[]): TipoResumenSemanal[] => {
    const tipoMap = new Map<number, { nombre_tipo: string; peso: number; minutos: number; codigo_color: string }>();

    actividades.forEach((actividad) => {
        const actual = tipoMap.get(actividad.id_tipo);
        const minutos = Number(actividad.durac_min || 0);
        if (actual) {
            tipoMap.set(actividad.id_tipo, {
                nombre_tipo: actividad.nombre_tipo,
                peso: actividad.peso,
                minutos: actual.minutos + minutos,
                codigo_color: actividad.codigo_color || actual.codigo_color
            });
        } else {
            tipoMap.set(actividad.id_tipo, {
                nombre_tipo: actividad.nombre_tipo,
                peso: actividad.peso,
                minutos,
                codigo_color: actividad.codigo_color || '#6b7280'
            });
        }
    });

    return Array.from(tipoMap.entries()).map(([id_tipo, datos]) => {
        const horas = Number((datos.minutos / 60).toFixed(1));
        return {
            id_tipo,
            nombre_tipo: datos.nombre_tipo,
            peso: datos.peso,
            color: datos.codigo_color,
            horas,
            resumen: generarResumenTipo(datos.nombre_tipo, horas),
            mensaje: generarMensajeMotivacional(datos.peso, horas)
        };
    });
};

export const obtenerResumenesSemanales = async (): Promise<SemanaResumen[]> => {
    const db = getDB();

    // 1. Obtenemos el enfoque del perfil actual para ligar el reporte (Requisito de llave foránea)
    const perfil = await db.get("SELECT Id_perfil, Id_enfoque FROM Perfil LIMIT 1");
    const idEnfoque = perfil?.Id_enfoque || 1;
    const idPerfil = perfil?.Id_perfil || 1;

    // 2. Traer todas las actividades con fecha
    const filas = await db.all(
        `SELECT a.Id_actividad, a.Id_tipo, a.hora_inicio, a.durac_min, a.desc_activ, a.fecha, a.hora_creac,
                t.Nombre_activ, t.Utilidad_objet, t.Codigo_color
           FROM Actividad a
           JOIN Tipo_actividad t ON a.Id_tipo = t.Id_tipo
          WHERE a.fecha IS NOT NULL
          ORDER BY a.fecha ASC, a.hora_inicio ASC`
    );

    const semanasMap = new Map<string, { fecha_inicio: string; fecha_fin: string; actividades: ActividadConTipoRow[] }>();

    filas.forEach((fila: any) => {
        if (!fila.fecha) return;
        const fechaActividad = new Date(`${fila.fecha}T00:00:00Z`);
        if (Number.isNaN(fechaActividad.getTime())) return;

        const lunes = getMonday(fechaActividad);
        const inicioSemana = formatDate(lunes);
        const finSemana = formatDate(addDays(lunes, 6));

        const actividad: ActividadConTipoRow = {
            id_actividad: Number(fila.Id_actividad),
            id_tipo: Number(fila.Id_tipo),
            hora_inicio: String(fila.hora_inicio ?? ''),
            durac_min: Number(fila.durac_min ?? 0),
            desc_activ: String(fila.desc_activ ?? ''),
            fecha: String(fila.fecha),
            hora_creacion: fila.hora_creac,
            nombre_tipo: String(fila.Nombre_activ ?? ''),
            peso: Number(fila.Utilidad_objet ?? 0),
            codigo_color: String(fila.Codigo_color ?? '#6b7280')
        };

        const semanaExistente = semanasMap.get(inicioSemana);
        if (semanaExistente) {
            semanaExistente.actividades.push(actividad);
        } else {
            semanasMap.set(inicioSemana, { fecha_inicio: inicioSemana, fecha_fin: finSemana, actividades: [actividad] });
        }
    });

    // 3. LA REGLA DEL TIEMPO: Filtrar solo semanas "cerradas" (donde Hoy > Domingo)
    const hoyStr = formatDate(new Date()); 
    const semanasCerradas = Array.from(semanasMap.values())
        .filter(semana => semana.fecha_fin < hoyStr)
        .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

    // 4. Consultar los reportes que YA están guardados en la tabla Reporte_semanal
    const reportesExistentes = await db.all("SELECT * FROM Reporte_semanal");
    const reportesMap = new Map();
    reportesExistentes.forEach(r => reportesMap.set(r.Fecha_i_semana, r));

    const resultadoFinal: SemanaResumen[] = [];

    // 5. Evaluar, Guardar y Construir respuesta
    for (let i = 0; i < semanasCerradas.length; i++) {
        const semana = semanasCerradas[i];
        let conclusionDB = "";

        if (reportesMap.has(semana.fecha_inicio)) {
            // Ya está en BD, usamos esa conclusión
            conclusionDB = reportesMap.get(semana.fecha_inicio).Conclusion;
        } else {
            // NUEVO REPORTE: Generamos, insertamos en BD y evaluamos logros
            conclusionDB = generarDescripcionGeneralPorSemana(semana.actividades);
            const progOptimizac = 85; // Puedes volver esto dinámico luego
            
            await db.run(
                `INSERT INTO Reporte_semanal (Id_enfoque, Fecha_i_semana, Fecha_f_semana, Conclusion, Prog_optimizac)
                 VALUES (?, ?, ?, ?, ?)`,
                [idEnfoque, semana.fecha_inicio, semana.fecha_fin, conclusionDB, progOptimizac]
            );
            console.log(`💾 Reporte automático generado para la semana del ${semana.fecha_inicio}`);

            // Evaluamos logros por si gana la recompensa "Analista"
            await evaluarNuevosLogros(idPerfil);
        }

        const totalMinutos = semana.actividades.reduce((sum, actividad) => sum + actividad.durac_min, 0);
        const totalHoras = Number((totalMinutos / 60).toFixed(1));

        resultadoFinal.push({
            numero_semana: i + 1,
            fecha_inicio: semana.fecha_inicio,
            fecha_fin: semana.fecha_fin,
            total_horas: totalHoras,
            total_actividades: semana.actividades.length,
            descripcion_general: conclusionDB,
            actividades: semana.actividades,
            tipos: resumirTiposPorSemana(semana.actividades)
        });
    }

    return resultadoFinal;
};