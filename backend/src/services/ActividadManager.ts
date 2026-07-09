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
