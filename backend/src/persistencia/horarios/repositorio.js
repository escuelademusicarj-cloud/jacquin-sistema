import { pool } from "../../config/db.js";

export async function listarSalas() {
  const { rows } = await pool.query(`SELECT * FROM salas ORDER BY nombre`);
  return rows;
}

export async function buscarClasePorId(id) {
  const { rows } = await pool.query(`SELECT * FROM clases WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function alumnoEsDelProfesor(alumnoId, profesorId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM clase_alumnos ca JOIN clases c ON c.id = ca.clase_id
     WHERE ca.alumno_id = $1 AND c.profesor_id = $2 LIMIT 1`,
    [alumnoId, profesorId]
  );
  return rows.length > 0;
}

export async function insertarClase(clase) {
  const { rows } = await pool.query(
    `INSERT INTO clases (profesor_id, sala_id, programa, tipo, dia_semana, hora_inicio, duracion_minutos)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [clase.profesorId, clase.salaId, clase.programa, clase.tipo, clase.diaSemana, clase.horaInicio, clase.duracionMinutos]
  );
  return rows[0];
}

export async function vincularAlumnoAClase(claseId, alumnoId) {
  await pool.query(`INSERT INTO clase_alumnos (clase_id, alumno_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [claseId, alumnoId]);
}

/** Detecta cruce: mismo profesor o misma sala, mismo día y hora — regla de "evitar que se crucen clases". */
export async function buscarCruce({ profesorId, salaId, diaSemana, horaInicio }) {
  const { rows } = await pool.query(
    `SELECT * FROM clases WHERE dia_semana = $1 AND hora_inicio = $2 AND estado = 'activa'
       AND (profesor_id = $3 OR sala_id = $4)`,
    [diaSemana, horaInicio, profesorId, salaId]
  );
  return rows;
}

export async function listarClases({ profesorId, alumnoId } = {}) {
  let sql = `SELECT c.*, s.nombre AS sala_nombre, u.nombre AS profesor_nombre FROM clases c
             LEFT JOIN salas s ON s.id = c.sala_id
             LEFT JOIN usuarios u ON u.id = c.profesor_id
             WHERE c.estado = 'activa'`;
  const params = [];
  if (profesorId) { params.push(profesorId); sql += ` AND c.profesor_id = $${params.length}`; }
  if (alumnoId) {
    sql = `SELECT c.*, s.nombre AS sala_nombre, u.nombre AS profesor_nombre FROM clases c
           LEFT JOIN salas s ON s.id = c.sala_id
           LEFT JOIN usuarios u ON u.id = c.profesor_id
           JOIN clase_alumnos ca ON ca.clase_id = c.id
           WHERE c.estado = 'activa' AND ca.alumno_id = $1`;
    params.length = 0; params.push(alumnoId);
  }
  sql += ` ORDER BY c.dia_semana, c.hora_inicio`;
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function insertarModificacion(mod) {
  const { rows } = await pool.query(
    `INSERT INTO clase_modificaciones (clase_id, alumno_id, tipo, fecha_original, fecha_nueva, motivo)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [mod.claseId, mod.alumnoId, mod.tipo, mod.fechaOriginal, mod.fechaNueva, mod.motivo]
  );
  return rows[0];
}

/** Cuenta recuperaciones del alumno dentro del mismo mes calendario que fechaOriginal. */
export async function recuperacionesDelMes(alumnoId, fechaOriginal) {
  const { rows } = await pool.query(
    `SELECT * FROM clase_modificaciones
     WHERE alumno_id = $1 AND tipo = 'recuperada'
       AND date_trunc('month', fecha_original) = date_trunc('month', $2::date)`,
    [alumnoId, fechaOriginal]
  );
  return rows;
}
