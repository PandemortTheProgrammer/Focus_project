// backend/src/services/ActividadManager.ts
import { ejecutarTransaccion, getDB } from '../config/db';
import Actividad from '../models/Actividad';
import Tipo_actividad from '../models/Tipo_actividad';
import { evaluarNuevosLogros } from './RecompensasManager';

interface ActividadRow {
  id_actividad?: number;
  Id_actividad?: number;
  id_tipo?: number;
  Id_tipo?: number;
  hora_inicio?: string;
  durac_min?: number;
  desc_activ?: string;
  fecha?: string | null; 
  hora_creacion?: string | null; 
  hora_creac?: string | null; 
}

function mapRowToActividad(row: ActividadRow): Actividad {
  const idActividad = Number(row.id_actividad ?? row.Id_actividad ?? 0);
  const idTipo = Number(row.id_tipo ?? row.Id_tipo ?? 0);
  const horaInicio = String(row.hora_inicio ?? '');
  const duracionMinutos = Number(row.durac_min ?? 0);
  const descripcionActividad = String(row.desc_activ ?? '');
  const horaCreacionRaw = row.hora_creacion ?? row.hora_creac ?? null;

  const actividad = new Actividad(idActividad, idTipo, horaInicio, duracionMinutos, descripcionActividad);

  if (row.fecha) actividad.fecha = new Date(row.fecha);
  if (horaCreacionRaw) actividad.hora_creacion = new Date(horaCreacionRaw);

  return actividad;
}

const VENTANA_EDICION_MS = 24 * 60 * 60 * 1000;

function estaArchivada(horaCreacion?: string | null): boolean {
  if (!horaCreacion) return false;
  const creado = new Date(horaCreacion).getTime();
  if (Number.isNaN(creado)) return false;
  return Date.now() - creado >= VENTANA_EDICION_MS;
}

export const obtenerTiposActividad = async (): Promise<Tipo_actividad[]> => {
  const db = getDB();
  const filas: Array<{ id_tipo: number; nombre_tipo: string; utilidad_objetiva: number; codigo_color: string }> = await db.all(`
    SELECT
      Id_tipo AS id_tipo,
      Nombre_activ AS nombre_tipo,
      Utilidad_objet AS utilidad_objetiva,
      Codigo_color AS codigo_color
    FROM Tipo_actividad
    ORDER BY Id_tipo ASC
  `);
  return filas.map((fila) => new Tipo_actividad(
    Number(fila.id_tipo),
    fila.nombre_tipo,
    Number(fila.utilidad_objetiva),
    fila.codigo_color
  ));
};

// Modificamos el retorno para devolver los datos de la subida de XP
export const registrarActividad = async (
  datos: Actividad,
  eventoEspecial?: string
): Promise<any> => {
  const db = getDB();
  const query = `INSERT INTO Actividad (Id_tipo, hora_inicio, durac_min, desc_activ, fecha, hora_creac) VALUES (?, ?, ?, ?, ?, ?)`;

  const horaCreacion = datos.hora_creacion ? datos.hora_creacion.toISOString() : new Date().toISOString();
  const now = new Date();
  
  const utcMinus5 = new Date(now.getTime() - (5 * 60 * 60 * 1000));
  const fechaLocal = utcMinus5.toISOString().split('T')[0];

  const primeraActividadDelDia = await ejecutarTransaccion(async (dbTransaccion) => {
    const actividadesPrevias = await dbTransaccion.get<{ total: number }>(
      'SELECT COUNT(*) AS total FROM Actividad WHERE fecha = ?',
      [fechaLocal]
    );
    const esPrimeraActividad = Number(actividadesPrevias?.total ?? 0) === 0;
    await dbTransaccion.run(query, [
      datos.id_tipo,
      datos.hora_inicio,
      datos.duracion_minutos,
      datos.descripcion_actividad,
      fechaLocal,
      horaCreacion
    ]);
    return esPrimeraActividad;
  });

  let logrosDesbloqueados: any[] = [];
  let datosXP = null;
  let errorXP: string | null = null;

  try {
    const perfilActivo = await db.get("SELECT Id_perfil FROM Perfil LIMIT 1");
    if (perfilActivo && perfilActivo.Id_perfil) {
      const resultado = await evaluarNuevosLogros(
        perfilActivo.Id_perfil,
        eventoEspecial,
        primeraActividadDelDia ? 600 : 100,
        primeraActividadDelDia ? 'Primera actividad del día' : 'Registro de actividad'
      );
      logrosDesbloqueados = resultado.logrosDesbloqueados;
      datosXP = resultado.resultadoXP;
    }
  } catch (error) {
    console.error("🔴 Error al evaluar recompensas o XP tras registrar actividad:", error);
    errorXP = error instanceof Error ? error.message : 'No se pudo procesar XP o logros.';
  }
  
  console.log("Actividad guardada en SQLite");
  
  // Devolvemos el formato exacto que tu controlador "createActividad" estaba esperando
  return { 
      logrosDesbloqueados: logrosDesbloqueados.length > 0 ? logrosDesbloqueados : [], 
      reporteGenerado: false, // La generación de reportes se maneja en su propio flujo
      resultadoXP: datosXP,
      errorXP
  };
};

export const obtenerActividades = async (): Promise<Actividad[]> => {
  const db = getDB();
  const query = `SELECT * FROM Actividad
                  WHERE hora_creac IS NULL OR datetime(hora_creac) > datetime('now', '-1 day')
                  ORDER BY id_actividad DESC`;
  const filas: ActividadRow[] = await db.all(query);
  return filas.map(mapRowToActividad);
};

export const obtenerActividadPorId = async (id: number): Promise<Actividad | null> => {
  const db = getDB();
  const fila: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  if (!fila) return null;
  return mapRowToActividad(fila);
};

export type ResultadoEliminacion = 'eliminada' | 'no_encontrada' | 'bloqueada';

export const eliminarActividad = async (id: number): Promise<ResultadoEliminacion> => {
  const db = getDB();
  const actual: ActividadRow | undefined = await db.get(`SELECT hora_creac FROM Actividad WHERE id_actividad = ?`, [id]);
  if (!actual) return 'no_encontrada';
  if (estaArchivada(actual.hora_creac)) return 'bloqueada';

  await db.run(`DELETE FROM Actividad WHERE id_actividad = ?`, [id]);
  return 'eliminada';
};

// La edición NO otorga XP para evitar farming artificial, se queda intacta.
export const editarActividad = async (id: number, datos: Partial<Actividad>): Promise<Actividad | null | 'bloqueada'> => {
  const db = getDB();
  const actual: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  if (!actual) return null;
  if (estaArchivada(actual.hora_creac)) return 'bloqueada';

  const id_tipo = (datos.id_tipo !== undefined) ? Number(datos.id_tipo) : actual.id_tipo;
  const hora_inicio = (datos.hora_inicio !== undefined) ? datos.hora_inicio : actual.hora_inicio;
  const durac_min = (datos.duracion_minutos !== undefined) ? Number(datos.duracion_minutos) : actual.durac_min;
  const desc_activ = (datos.descripcion_actividad !== undefined) ? datos.descripcion_actividad : actual.desc_activ;
  const fecha: string | null = (datos.fecha !== undefined)
    ? ((datos.fecha instanceof Date) ? datos.fecha.toISOString().split('T')[0] : String(datos.fecha))
    : (typeof actual.fecha === 'string' && actual.fecha.length > 0 ? actual.fecha : null);

  await db.run(
    `UPDATE Actividad SET id_tipo = ?, hora_inicio = ?, durac_min = ?, desc_activ = ?, fecha = ? WHERE id_actividad = ?`,
    [id_tipo, hora_inicio, durac_min, desc_activ, fecha, id]
  );

  const actualizado: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  return actualizado ? mapRowToActividad(actualizado) : null;
};

export const actividadesSemana = async (): Promise<Record<string, Actividad[]>> => {
  const db = getDB();
  const hoy = new Date();
  const hace7dias = new Date();
  hace7dias.setDate(hoy.getDate() - 6);

  const desde = hace7dias.toISOString().split('T')[0];
  const hasta = hoy.toISOString().split('T')[0];

  const filas: ActividadRow[] = await db.all(`SELECT * FROM Actividad WHERE fecha BETWEEN ? AND ? ORDER BY fecha ASC, hora_inicio ASC`, [desde, hasta]);
  const agrupadas: Record<string, Actividad[]> = {};
  
  filas.forEach(f => {
    const clave = (typeof f.fecha === 'string' && f.fecha.length > 0) ? f.fecha : (typeof f.hora_inicio === 'string' && f.hora_inicio.length > 0 ? new Date(f.hora_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    if (!agrupadas[clave]) agrupadas[clave] = [];
    agrupadas[clave].push(mapRowToActividad(f));
  });

  return agrupadas;
};

export const obtenerHistorialActividades = async (): Promise<Actividad[]> => {
  const db = getDB();
  const filas: ActividadRow[] = await db.all(
    `SELECT * FROM Actividad
      WHERE hora_creac IS NOT NULL AND datetime(hora_creac) <= datetime('now', '-1 day')
      ORDER BY fecha DESC, hora_inicio DESC`
  );
  return filas.map(mapRowToActividad);
};