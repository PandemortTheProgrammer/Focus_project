// backend/src/services/ActividadManager.ts
import { getDB } from '../config/db';
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

export const obtenerTiposActividad = async (): Promise<Tipo_actividad[]> => {
  const db = getDB();
  const filas: Array<{Id_tipo?: number; Nombre_activ?: string; Utilidad_objet?: number; Codigo_color?: string;}> = await db.all("SELECT * FROM Tipo_actividad ORDER BY Id_tipo ASC");
  return filas.map((f) => new Tipo_actividad(Number(f.Id_tipo ?? 0), String(f.Nombre_activ ?? ''), Number(f.Utilidad_objet ?? 0), String(f.Codigo_color ?? '#6b7280')));
};

export const registrarActividad = async (datos: Actividad): Promise<void> => {
  const db = getDB();
  const query = `INSERT INTO Actividad (Id_tipo, hora_inicio, durac_min, desc_activ, fecha, hora_creac) VALUES (?, ?, ?, ?, ?, ?)`;
  const horaCreacion = datos.hora_creacion ? datos.hora_creacion.toISOString() : new Date().toISOString();

  await db.run(query, [
    datos.id_tipo,
    datos.hora_inicio,
    datos.duracion_minutos,
    datos.descripcion_actividad,
    datos.fecha ? datos.fecha.toISOString().split('T')[0] : null,
    horaCreacion
  ]);

  try {
    const perfilActivo = await db.get("SELECT Id_perfil FROM Perfil LIMIT 1");
    if (perfilActivo && perfilActivo.Id_perfil) {
      await evaluarNuevosLogros(perfilActivo.Id_perfil);
    }
  } catch (error) {
    console.error("🔴 Error al evaluar recompensas tras registrar actividad:", error);
  }
  console.log("Actividad guardada en SQLite");
};

export const obtenerActividades = async (): Promise<Actividad[]> => {
  const db = getDB();
  const query = `SELECT * FROM Actividad ORDER BY id_actividad DESC`;
  const filas: ActividadRow[] = await db.all(query);
  return filas.map(mapRowToActividad);
};

export const obtenerActividadPorId = async (id: number): Promise<Actividad | null> => {
  const db = getDB();
  const fila: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  if (!fila) return null;
  return mapRowToActividad(fila);
};

export const eliminarActividad = async (id: number): Promise<void> => {
  const db = getDB();
  const query = `DELETE FROM Actividad WHERE id_actividad = ?`;
  await db.run(query, [id]);
};

export const editarActividad = async (id: number, datos: Partial<Actividad>): Promise<Actividad | null> => {
  const db = getDB();
  const actual: ActividadRow | undefined = await db.get(`SELECT * FROM Actividad WHERE id_actividad = ?`, [id]);
  if (!actual) return null;

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
  const haceUnaSemana = new Date();
  haceUnaSemana.setDate(haceUnaSemana.getDate() - 7);
  const limite = haceUnaSemana.toISOString().split('T')[0];

  const filas: ActividadRow[] = await db.all(`SELECT * FROM Actividad WHERE fecha < ? ORDER BY fecha DESC, hora_inicio DESC`, [limite]);
  return filas.map(mapRowToActividad);
};