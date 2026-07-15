// backend/src/services/ActividadManager.ts
import { getDB } from '../config/db';
import Actividad from '../models/Actividad';
import Tipo_actividad from '../models/Tipo_actividad';


// El catálogo de tipos se obtiene siempre desde la base de datos.
// No se mantiene un array hardcodeado porque puede desincronizarse con lo que existe en BD.

// Tipado de fila de la tabla Actividad
interface ActividadRow {
  id_actividad?: number;
  Id_actividad?: number;
  id_tipo?: number;
  Id_tipo?: number;
  hora_inicio?: string;
  durac_min?: number;
  desc_activ?: string;
  fecha?: string | null; // "YYYY-MM-DD"
  hora_creacion?: string | null; // ISO string si la guardas
}

/** Helper: mapear fila de BD a instancia Actividad */
function mapRowToActividad(row: ActividadRow): Actividad {
  const idActividad = Number(row.id_actividad ?? row.Id_actividad ?? 0);
  const idTipo = Number(row.id_tipo ?? row.Id_tipo ?? 0);
  const horaInicio = String(row.hora_inicio ?? '');
  const duracionMinutos = Number(row.durac_min ?? 0);
  const descripcionActividad = String(row.desc_activ ?? '');

  const actividad = new Actividad(
    idActividad,
    idTipo,
    horaInicio,
    duracionMinutos,
    descripcionActividad
  );

  if (row.fecha) actividad.fecha = new Date(row.fecha);
  if (row.hora_creacion) actividad.hora_creacion = new Date(row.hora_creacion);

  return actividad;
}

// Obtener tipos desde la tabla Tipo_actividad (fuente de verdad)
export const obtenerTiposActividad = async (): Promise<Tipo_actividad[]> => {
  const db = getDB();
  const filas: Array<{ Id_tipo?: number; Nombre_activ?: string; Utilidad_objet?: number }> =
    await db.all("SELECT * FROM Tipo_actividad ORDER BY Id_tipo ASC");

  return filas.map((f) =>
    new Tipo_actividad(
      Number(f.Id_tipo ?? 0),
      String(f.Nombre_activ ?? ''),
      Number(f.Utilidad_objet ?? 0)
    )
  );
};

// 1. POST: Guardar en la Base de Datos Real
export const registrarActividad = async (datos: Actividad): Promise<void> => {
  const db = getDB();

  const query = `
    INSERT INTO Actividad (Id_tipo, hora_inicio, durac_min, desc_activ)
    VALUES (?, ?, ?, ?)
  `;

  await db.run(query, [
    datos.id_tipo,
    datos.hora_inicio,
    datos.duracion_minutos,
    datos.descripcion_actividad,
    
  ]);

  console.log("Actividad guardada en SQLite");
};

// 2. GET: Obtener desde la Base de Datos Real
export const obtenerActividades = async (): Promise<Actividad[]> => {
  const db = getDB();
  const query = `SELECT * FROM Actividad ORDER BY id_actividad DESC`;
  const filas: ActividadRow[] = await db.all(query);
  return filas.map(mapRowToActividad);
};

// Obtener actividad por id (útil para editar/validar)
export const obtenerActividadPorId = async (id: number): Promise<Actividad | null> => {
  const db = getDB();
  const fila: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  if (!fila) return null;
  return mapRowToActividad(fila);
};

// 3. DELETE: Eliminar de la Base de Datos Real
export const eliminarActividad = async (id: number): Promise<void> => {
  const db = getDB();
  const query = `DELETE FROM Actividad WHERE id_actividad = ?`;
  await db.run(query, [id]);
};

// 4. PUT/PATCH: Editar actividad (parcial) — adaptado desde Test a SQLite
export const editarActividad = async (id: number, datos: Partial<Actividad>): Promise<Actividad | null> => {
  const db = getDB();

  // Obtener la actividad actual
  const actual: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  if (!actual) return null;

  // Determinar valores nuevos (si vienen en datos, los usamos; si no, mantenemos actuales)
  const id_tipo = (datos.id_tipo !== undefined) ? Number(datos.id_tipo) : actual.id_tipo;
  const hora_inicio = (datos.hora_inicio !== undefined) ? datos.hora_inicio : actual.hora_inicio;
  const durac_min = (datos.duracion_minutos !== undefined) ? Number(datos.duracion_minutos) : actual.durac_min;
  const desc_activ = (datos.descripcion_actividad !== undefined) ? datos.descripcion_actividad : actual.desc_activ;
  const fecha: string | null = (datos.fecha !== undefined)
    ? ((datos.fecha instanceof Date) ? datos.fecha.toISOString().split('T')[0] : String(datos.fecha))
    : (typeof actual.fecha === 'string' && actual.fecha.length > 0 ? actual.fecha : null);

  await db.run(
    `UPDATE Actividad
     SET id_tipo = ?, hora_inicio = ?, durac_min = ?, desc_activ = ?, fecha = ?
     WHERE id_actividad = ?`,
    [id_tipo, hora_inicio, durac_min, desc_activ, fecha, id]
  );

  const actualizado: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  return actualizado ? mapRowToActividad(actualizado) : null;
};

// 5. actividadesSemana: agrupar actividades de los últimos 7 días por fecha (YYYY-MM-DD)
export const actividadesSemana = async (): Promise<Record<string, Actividad[]>> => {
  const db = getDB();
  const hoy = new Date();
  const hace7dias = new Date();
  hace7dias.setDate(hoy.getDate() - 6); // últimos 7 días incluyendo hoy

  const desde = hace7dias.toISOString().split('T')[0];
  const hasta = hoy.toISOString().split('T')[0];

  const filas: ActividadRow[] = await db.all(
    `SELECT * FROM Actividad WHERE fecha BETWEEN ? AND ? ORDER BY fecha ASC, hora_inicio ASC`,
    [desde, hasta]
  );

  const agrupadas: Record<string, Actividad[]> = {};
  filas.forEach(f => {
    const clave = (typeof f.fecha === 'string' && f.fecha.length > 0)
      ? f.fecha
      : (typeof f.hora_inicio === 'string' && f.hora_inicio.length > 0
          ? new Date(f.hora_inicio).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]);
    if (!agrupadas[clave]) agrupadas[clave] = [];
    agrupadas[clave].push(mapRowToActividad(f));
  });

  return agrupadas;
};

interface ActividadConTipoRow {
  id_actividad: number;
  id_tipo: number;
  hora_inicio: string;
  durac_min: number;
  desc_activ: string;
  fecha: string;
  hora_creacion?: string;
  nombre_tipo: string;
  peso: number;
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
  const diff = (day + 6) % 7; // Monday = 0, Sunday = 6
  copy.setUTCDate(copy.getUTCDate() - diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const getColorForType = (nombreTipo: string): string => {
  const normalized = nombreTipo.toLowerCase();
  if (normalized.includes('estudio')) return '#1a7a6e';
  if (normalized.includes('dormir')) return '#3b82f6';
  if (normalized.includes('ejercicio')) return '#d946ef';
  if (normalized.includes('lectura') || normalized.includes('leer')) return '#f97316';
  if (normalized.includes('trabajo')) return '#eab308';
  if (normalized.includes('deporte')) return '#10b981';
  if (normalized.includes('series')) return '#8b5cf6';
  if (normalized.includes('música') || normalized.includes('musica')) return '#ec4899';
  if (normalized.includes('redes')) return '#f43f5e';
  return '#6b7280';
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

  if (porPeso.prioritarios >= 8 && porPeso.menores <= 2) {
    return 'Semana con foco en prioridades: buenas decisiones y avance constante en actividades clave.';
  }

  if (porPeso.menores > porPeso.prioritarios + 2) {
    return 'La semana tuvo más ocio menor de lo ideal; vale la pena realinear el tiempo hacia lo más importante.';
  }

  if (porPeso.moderados > 6) {
    return 'Hay un buen equilibrio, aunque es recomendable ajustar algunas horas de ocio moderado.';
  }

  return 'Buena semana con espacio para seguir mejorando el equilibrio entre rutinas y descanso.';
};

const resumirTiposPorSemana = (actividades: ActividadConTipoRow[]): TipoResumenSemanal[] => {
  const tipoMap = new Map<number, { nombre_tipo: string; peso: number; minutos: number }>();

  actividades.forEach((actividad) => {
    const actual = tipoMap.get(actividad.id_tipo);
    const minutos = Number(actividad.durac_min || 0);
    if (actual) {
      tipoMap.set(actividad.id_tipo, {
        nombre_tipo: actividad.nombre_tipo,
        peso: actividad.peso,
        minutos: actual.minutos + minutos
      });
    } else {
      tipoMap.set(actividad.id_tipo, {
        nombre_tipo: actividad.nombre_tipo,
        peso: actividad.peso,
        minutos
      });
    }
  });

  return Array.from(tipoMap.entries()).map(([id_tipo, datos]) => {
    const horas = Number((datos.minutos / 60).toFixed(1));
    return {
      id_tipo,
      nombre_tipo: datos.nombre_tipo,
      peso: datos.peso,
      color: getColorForType(datos.nombre_tipo),
      horas,
      resumen: generarResumenTipo(datos.nombre_tipo, horas),
      mensaje: generarMensajeMotivacional(datos.peso, horas)
    };
  });
};

export const obtenerResumenesSemanales = async (): Promise<SemanaResumen[]> => {
  const db = getDB();

  const filas: Array<{
    Id_actividad: number;
    Id_tipo: number;
    hora_inicio: string;
    durac_min: number;
    desc_activ: string;
    fecha: string;
    hora_creac?: string;
    Nombre_activ?: string;
    Utilidad_objet?: number;
  }> = await db.all(
    `SELECT a.Id_actividad, a.Id_tipo, a.hora_inicio, a.durac_min, a.desc_activ, a.fecha, a.hora_creac,
            t.Nombre_activ, t.Utilidad_objet
       FROM Actividad a
       JOIN Tipo_actividad t ON a.Id_tipo = t.Id_tipo
      WHERE a.fecha IS NOT NULL
      ORDER BY a.fecha ASC, a.hora_inicio ASC`
  );

  const semanasMap = new Map<string, { fecha_inicio: string; fecha_fin: string; actividades: ActividadConTipoRow[] }>();

  filas.forEach((fila) => {
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
      peso: Number(fila.Utilidad_objet ?? 0)
    };

    const semanaExistente = semanasMap.get(inicioSemana);
    if (semanaExistente) {
      semanaExistente.actividades.push(actividad);
      return;
    }

    semanasMap.set(inicioSemana, {
      fecha_inicio: inicioSemana,
      fecha_fin: finSemana,
      actividades: [actividad]
    });
  });

  const semanasOrdenadas = Array.from(semanasMap.values()).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

  return semanasOrdenadas.map((semana, index) => {
    const totalMinutos = semana.actividades.reduce((sum, actividad) => sum + actividad.durac_min, 0);
    const totalHoras = Number((totalMinutos / 60).toFixed(1));

    return {
      numero_semana: index + 1,
      fecha_inicio: semana.fecha_inicio,
      fecha_fin: semana.fecha_fin,
      total_horas: totalHoras,
      total_actividades: semana.actividades.length,
      descripcion_general: generarDescripcionGeneralPorSemana(semana.actividades),
      actividades: semana.actividades,
      tipos: resumirTiposPorSemana(semana.actividades)
    };
  });};
