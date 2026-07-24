// backend/src/services/ReporteManager.ts
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

interface ActividadConTipoRawRow {
    Id_actividad: number;
    Id_tipo: number;
    hora_inicio: string | null;
    durac_min: number | null;
    desc_activ: string | null;
    fecha: string | null;
    hora_creac?: string;
    Nombre_activ: string | null;
    Utilidad_objet: number | null;
    Codigo_color: string | null;
}

export interface TipoResumenSemanal {
    id_tipo: number;
    nombre_tipo: string;
    peso: number;
    color: string;
    horas: number;
    porcentaje_semana: number;
    num_actividades: number;
    promedio_sesion_min: number;
    dias_activos: number;
    tendencia: 'subio' | 'bajo' | 'igual' | 'nuevo';
    variacion_horas: number;
    resumen: string;
    mensaje: string;
    consejo: string;
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

const generarResumenTipo = (
    nombreTipo: string,
    horas: number,
    numActividades: number,
    porcentajeSemana: number,
    diasActivos: number,
    promedioSesionMin: number
): string => {
    const frecuencia = numActividades === 1
        ? 'en 1 sesión'
        : `en ${numActividades} sesiones repartidas en ${diasActivos} día${diasActivos === 1 ? '' : 's'}`;
    return `Durante la semana destinaste ${horas.toFixed(1)}h a ${nombreTipo.toLowerCase()} ${frecuencia} (${porcentajeSemana}% de tu tiempo registrado), con un promedio de ${promedioSesionMin} min por sesión.`;
};

const ACTIVIDADES_TRABAJO = new Set(['Trabajo']);
const ACTIVIDADES_ADMINISTRATIVAS = new Set(['Realizar un trámite']);
const ACTIVIDADES_BIENESTAR = new Set(['Meditación', 'Descanso activo']);
const ACTIVIDADES_SOCIAL_CREATIVA = new Set(['Socializar', 'Expresión artística']);

const generarMensajeMotivacional = (nombreTipo: string, peso: number, horas: number, diasActivos: number): string => {
    if (ACTIVIDADES_TRABAJO.has(nombreTipo)) {
        if (horas > 60) return 'Alerta de sobrecarga: superaste las 60h semanales de trabajo, un nivel asociado a agotamiento; considera reducir la carga o delegar tareas.';
        if (horas > 48) return 'Carga alta: trabajaste por encima de una jornada estándar; vigila tu descanso para evitar el desgaste.';
        if (horas >= 20) return 'Buen ritmo laboral: mantienes una dedicación estable a tu trabajo esta semana.';
        if (horas > 0) return 'Actividad laboral moderada esta semana; trabajar es necesario, solo asegúrate de que se ajuste bien a tus demás compromisos.';
        return 'No registraste horas de trabajo esta semana.';
    }
    if (ACTIVIDADES_ADMINISTRATIVAS.has(nombreTipo)) {
        if (horas === 0) return 'No tuviste trámites pendientes registrados esta semana.';
        if (horas <= 3) return 'Mantienes tus trámites bajo control, resolviéndolos sin que te quiten demasiado tiempo.';
        return 'Dedicaste bastante tiempo a trámites esta semana; si se repite, revisa si puedes agilizarlos o programarlos con anticipación.';
    }
    if (ACTIVIDADES_BIENESTAR.has(nombreTipo)) {
        if (horas < 0.5) return 'Podrías beneficiarte de dedicar un poco más de tiempo a esta práctica de bienestar.';
        if (horas <= 7) return 'Buen hábito de bienestar: este tiempo apoya tu equilibrio emocional y físico.';
        return 'Le dedicas bastante tiempo a esta práctica; sigue siendo positivo, solo confirma que no esté sustituyendo otras responsabilidades.';
    }
    if (ACTIVIDADES_SOCIAL_CREATIVA.has(nombreTipo)) {
        if (horas < 1) return 'Podrías beneficiarte de más momentos así durante la semana.';
        if (horas <= 8) return 'Buen balance: este tiempo aporta positivamente a tu bienestar social o creativo.';
        return 'Le dedicas mucho tiempo a esta actividad; está bien si te llena, solo vigila que no reste espacio a otras responsabilidades.';
    }
    if (peso >= 4) {
        if (horas > 5 && diasActivos >= 4) return 'Excelente dedicación: mantienes una rutina constante y sólida en tus prioridades más importantes durante casi toda la semana.';
        if (horas > 5) return 'Excelente dedicación: estás reforzando tus prioridades más importantes, aunque concentrada en pocos días; repártela más para ganar consistencia.';
        if (horas >= 2 && diasActivos >= 3) return 'Bien hecho: mantienes una rutina positiva y constante en actividades clave.';
        if (horas >= 2) return 'Bien hecho: mantienes una rutina positiva en actividades clave, aunque podrías distribuirla en más días.';
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
        if (horas <= 3) return 'Atención: modera estas horas de ocio y prioriza otros hábitos.';
        return 'Excesivo: demasiado tiempo en habilidades de bajo impacto. Busca un cambio de ritmo.';
    }
    return 'Sigue observando cómo se integra esta actividad en tu semana.';
};

const generarConsejoTipo = (
    nombreTipo: string,
    peso: number,
    horas: number,
    numActividades: number,
    diasActivos: number,
    promedioSesionMin: number
): string => {
    if (ACTIVIDADES_TRABAJO.has(nombreTipo)) {
        if (horas > 60) return 'Considera hablar con tu equipo o superior sobre la carga de trabajo; un ritmo así de forma sostenida aumenta el riesgo de agotamiento.';
        if (horas > 48) return 'Procura delimitar horarios de desconexión; trabajar por encima de una jornada estándar de forma constante puede afectar tu descanso.';
        if (horas > 0 && diasActivos <= 2) return 'Repartir tus horas laborales en más días puede ayudarte a mantener un ritmo más sostenible.';
        return 'Mantén tus límites de horario para conservar el equilibrio entre trabajo y vida personal.';
    }
    if (ACTIVIDADES_ADMINISTRATIVAS.has(nombreTipo)) {
        if (numActividades > 5) return 'Agrupa tus trámites en un mismo bloque o día para resolverlos con menos fricción.';
        return 'Sigue resolviendo tus trámites a tiempo para evitar que se acumulen.';
    }
    if (ACTIVIDADES_BIENESTAR.has(nombreTipo)) {
        if (promedioSesionMin > 0 && promedioSesionMin < 10) return 'Prueba extender un poco estas sesiones; unos minutos más pueden profundizar sus beneficios.';
        return 'Continúa con esta práctica; es un buen pilar para tu bienestar.';
    }
    if (ACTIVIDADES_SOCIAL_CREATIVA.has(nombreTipo)) {
        if (diasActivos <= 1 && horas > 0) return 'Intenta repartir estos momentos en más días para disfrutar sus beneficios de forma más constante.';
        return 'Sigue cultivando este espacio; aporta positivamente a tu bienestar.';
    }
    if (peso >= 4) {
        if (horas > 0 && diasActivos <= 2) return 'Prueba distribuir esta actividad en más días de la semana para construir un hábito más estable.';
        if (promedioSesionMin > 0 && promedioSesionMin < 20) return 'Tus sesiones son cortas; bloques de al menos 25-30 minutos suelen mejorar el enfoque y los resultados.';
        return 'Mantén este ritmo y considera fijar un horario recurrente para automatizar el hábito.';
    }
    if (peso >= 2) {
        if (numActividades > 8) return 'Repites esta actividad muy seguido; agrupa sesiones para liberar tiempo hacia tus prioridades.';
        return 'Vigila que estas horas no crezcan demasiado para que sigan siendo un descanso planificado y no un refugio del resto de tus responsabilidades.';
    }
    if (peso === 1) {
        if (horas > 3) return 'Define un límite diario para este tipo de ocio y sustitúyelo gradualmente por actividades de mayor impacto.';
        return 'Está bajo control; solo asegúrate de que no reemplace tiempo de descanso reparador.';
    }
    return 'Sigue registrando esta actividad para obtener recomendaciones más precisas.';
};

const calcularTendencia = (
    horasActual: number,
    horasAnterior: number | undefined
): { tendencia: 'subio' | 'bajo' | 'igual' | 'nuevo'; variacion: number; texto: string } => {
    if (horasAnterior === undefined) {
        return { tendencia: 'nuevo', variacion: horasActual, texto: 'Es la primera semana en la que registras este tipo de actividad.' };
    }
    const variacion = Number((horasActual - horasAnterior).toFixed(1));
    if (Math.abs(variacion) < 0.3) {
        return { tendencia: 'igual', variacion, texto: 'Mantuviste un ritmo similar al de la semana pasada.' };
    }
    if (variacion > 0) {
        return { tendencia: 'subio', variacion, texto: `Aumentaste ${variacion.toFixed(1)}h respecto a la semana anterior.` };
    }
    return { tendencia: 'bajo', variacion, texto: `Redujiste ${Math.abs(variacion).toFixed(1)}h respecto a la semana anterior.` };
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

const resumirTiposPorSemana = (
    actividades: ActividadConTipoRow[],
    totalMinutosSemana: number,
    horasSemanaAnteriorPorTipo: Map<number, number>
): TipoResumenSemanal[] => {
    const tipoMap = new Map<number, { nombre_tipo: string; peso: number; minutos: number; codigo_color: string; numActividades: number; dias: Set<string> }>();

    actividades.forEach((actividad) => {
        const actual = tipoMap.get(actividad.id_tipo);
        const minutos = Number(actividad.durac_min || 0);
        if (actual) {
            actual.minutos += minutos;
            actual.numActividades += 1;
            actual.dias.add(actividad.fecha);
            actual.nombre_tipo = actividad.nombre_tipo;
            actual.peso = actividad.peso;
            actual.codigo_color = actividad.codigo_color || actual.codigo_color;
        } else {
            tipoMap.set(actividad.id_tipo, {
                nombre_tipo: actividad.nombre_tipo,
                peso: actividad.peso,
                minutos,
                codigo_color: actividad.codigo_color || '#6b7280',
                numActividades: 1,
                dias: new Set([actividad.fecha])
            });
        }
    });

    return Array.from(tipoMap.entries())
        .map(([id_tipo, datos]) => {
            const horas = Number((datos.minutos / 60).toFixed(1));
            const porcentajeSemana = totalMinutosSemana > 0 ? Number(((datos.minutos / totalMinutosSemana) * 100).toFixed(0)) : 0;
            const diasActivos = datos.dias.size;
            const promedioSesionMin = datos.numActividades > 0 ? Number((datos.minutos / datos.numActividades).toFixed(0)) : 0;
            const { tendencia, variacion, texto: tendenciaTexto } = calcularTendencia(horas, horasSemanaAnteriorPorTipo.get(id_tipo));

            return {
                id_tipo,
                nombre_tipo: datos.nombre_tipo,
                peso: datos.peso,
                color: datos.codigo_color,
                horas,
                porcentaje_semana: porcentajeSemana,
                num_actividades: datos.numActividades,
                promedio_sesion_min: promedioSesionMin,
                dias_activos: diasActivos,
                tendencia,
                variacion_horas: variacion,
                resumen: generarResumenTipo(datos.nombre_tipo, horas, datos.numActividades, porcentajeSemana, diasActivos, promedioSesionMin),
                mensaje: `${generarMensajeMotivacional(datos.nombre_tipo, datos.peso, horas, diasActivos)} ${tendenciaTexto}`,
                consejo: generarConsejoTipo(datos.nombre_tipo, datos.peso, horas, datos.numActividades, diasActivos, promedioSesionMin)
            };
        })
        .sort((a, b) => b.horas - a.horas);
};

export const obtenerResumenesSemanales = async (): Promise<SemanaResumen[]> => {
    const db = getDB();

    // 1. Obtenemos el enfoque del perfil actual para ligar el reporte
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

    filas.forEach((fila: ActividadConTipoRawRow) => {
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

    // 3. LA REGLA DEL TIEMPO: Filtrar solo semanas "cerradas"
    const hoyStr = formatDate(new Date()); 
    const semanasCerradas = Array.from(semanasMap.values())
        .filter(semana => semana.fecha_fin < hoyStr)
        .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

    // 4. Consultar reportes YA guardados
    const reportesExistentes = await db.all("SELECT * FROM Reporte_semanal ORDER BY Fecha_i_semana ASC");
    const reportesMap = new Map();
    reportesExistentes.forEach(r => reportesMap.set(r.Fecha_i_semana, r));

    // LÓGICA LOGRO 16: Rastrear el último enfoque conocido
    let ultimoEnfoqueReportado = reportesExistentes.length > 0
        ? reportesExistentes[reportesExistentes.length - 1].Id_enfoque
        : null;

    const resultadoFinal: SemanaResumen[] = [];

    // 5. Evaluar, Guardar y Construir respuesta
    for (let i = 0; i < semanasCerradas.length; i++) {
        const semana = semanasCerradas[i];
        let conclusionDB: string;

        if (reportesMap.has(semana.fecha_inicio)) {
            conclusionDB = reportesMap.get(semana.fecha_inicio).Conclusion;
            ultimoEnfoqueReportado = reportesMap.get(semana.fecha_inicio).Id_enfoque;
        } else {
            // Generamos e insertamos en BD el nuevo reporte
            conclusionDB = generarDescripcionGeneralPorSemana(semana.actividades);
            const progOptimizac = 85; 
            
            await db.run(
                `INSERT INTO Reporte_semanal (Id_enfoque, Fecha_i_semana, Fecha_f_semana, Conclusion, Prog_optimizac)
                VALUES (?, ?, ?, ?, ?)`,
                [idEnfoque, semana.fecha_inicio, semana.fecha_fin, conclusionDB, progOptimizac]
            );
            console.log(`✅ Reporte automático generado para la semana del ${semana.fecha_inicio}`);

            // --- EVALUACIÓN ESPECIAL DE LOGROS ---
            let eventoEspecial: string | undefined = undefined;

            if (ultimoEnfoqueReportado !== null && ultimoEnfoqueReportado !== idEnfoque) {
                eventoEspecial = 'REPORTE_NUEVO_ENFOQUE';
            }

            ultimoEnfoqueReportado = idEnfoque;

            // Evaluamos logros de forma silenciosa en segundo plano
            await evaluarNuevosLogros(idPerfil, eventoEspecial);
        }

        const totalMinutos = semana.actividades.reduce((sum, actividad) => sum + actividad.durac_min, 0);
        const totalHoras = Number((totalMinutos / 60).toFixed(1));

        const horasSemanaAnteriorPorTipo = new Map<number, number>();
        if (i > 0) {
            resultadoFinal[i - 1].tipos.forEach((tipo) => horasSemanaAnteriorPorTipo.set(tipo.id_tipo, tipo.horas));
        }

        resultadoFinal.push({
            numero_semana: i + 1,
            fecha_inicio: semana.fecha_inicio,
            fecha_fin: semana.fecha_fin,
            total_horas: totalHoras,
            total_actividades: semana.actividades.length,
            descripcion_general: conclusionDB,
            actividades: semana.actividades,
            tipos: resumirTiposPorSemana(semana.actividades, totalMinutos, horasSemanaAnteriorPorTipo)
        });
    }

    // Devolvemos el array plano que tus vistas de frontend esperan
    return resultadoFinal;
};