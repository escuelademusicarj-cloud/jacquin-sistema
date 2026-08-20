import { pool } from "../../config/db.js";

export async function insertarAlumno(alumno) {
  const { rows } = await pool.query(
    `INSERT INTO alumnos (nombres, apellidos, documento, fecha_nacimiento, telefono_contacto, email_contacto, programa_principal, profesor_id, observaciones, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [alumno.nombres, alumno.apellidos, alumno.documento, alumno.fechaNacimiento, alumno.telefonoContacto,
     alumno.emailContacto, alumno.programaPrincipal, alumno.profesorId, alumno.observaciones, alumno.estado]
  );
  return rows[0];
}

export async function listarAlumnos({ estado, profesorId } = {}) {
  const condiciones = [];
  const params = [];
  if (estado) { params.push(estado); condiciones.push(`estado = $${params.length}`); }
  if (profesorId) { params.push(profesorId); condiciones.push(`profesor_id = $${params.length}`); }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const { rows } = await pool.query(`SELECT * FROM alumnos ${where} ORDER BY apellidos, nombres`, params);
  return rows;
}

export async function buscarAlumnoPorId(id) {
  const { rows } = await pool.query(`SELECT * FROM alumnos WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function actualizarEstadoAlumno(id, estadoNuevo) {
  const { rows } = await pool.query(
    `UPDATE alumnos SET estado = $1, actualizado_en = now() WHERE id = $2 RETURNING *`,
    [estadoNuevo, id]
  );
  return rows[0];
}

export async function insertarHistorialEstado({ alumnoId, estadoAnterior, estadoNuevo, motivo }) {
  await pool.query(
    `INSERT INTO alumno_historial_estados (alumno_id, estado_anterior, estado_nuevo, motivo) VALUES ($1,$2,$3,$4)`,
    [alumnoId, estadoAnterior, estadoNuevo, motivo ?? null]
  );
}

export async function insertarAcudiente(acudiente) {
  const { rows } = await pool.query(
    `INSERT INTO acudientes (nombre, documento, telefono, email) VALUES ($1,$2,$3,$4) RETURNING *`,
    [acudiente.nombre, acudiente.documento, acudiente.telefono, acudiente.email]
  );
  return rows[0];
}

export async function vincularAcudiente({ alumnoId, acudienteId, relacion }) {
  await pool.query(
    `INSERT INTO alumno_acudientes (alumno_id, acudiente_id, relacion) VALUES ($1,$2,$3)`,
    [alumnoId, acudienteId, relacion ?? null]
  );
}

export async function acudientesDeAlumno(alumnoId) {
  const { rows } = await pool.query(
    `SELECT a.*, aa.relacion FROM acudientes a
     JOIN alumno_acudientes aa ON aa.acudiente_id = a.id
     WHERE aa.alumno_id = $1`,
    [alumnoId]
  );
  return rows;
}

/**
 * Estudiantes cuyo cumpleaños (mes-día, sin importar el año) cae en alguno
 * de los días dados. diasMD es un arreglo de strings 'MM-DD', por ejemplo
 * ['08-24','08-25',...] — se arma así (no con un rango de fechas completo)
 * para que funcione bien incluso si la semana cruza de diciembre a enero.
 * Agregado 2026-08-20 para el reporte semanal de Cowork.
 */
export async function estudiantesConCumpleanosEnDias(diasMD) {
  const { rows } = await pool.query(
    `SELECT id, nombres, apellidos, fecha_nacimiento
     FROM alumnos
     WHERE fecha_nacimiento IS NOT NULL
       AND TO_CHAR(fecha_nacimiento, 'MM-DD') = ANY($1::text[])
     ORDER BY TO_CHAR(fecha_nacimiento, 'MM-DD')`,
    [diasMD]
  );
  return rows;
}
