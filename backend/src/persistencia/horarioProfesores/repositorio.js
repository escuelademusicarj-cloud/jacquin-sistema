import { pool } from "../../config/db.js";

/** Trae todo el horario semanal de profesores, con el nombre del profesor ya resuelto. */
export async function listarHorarioProfesores() {
  const { rows } = await pool.query(
    `SELECT hp.*, u.nombre AS profesor_nombre
     FROM horario_profesores hp
     JOIN usuarios u ON u.id = hp.profesor_id
     ORDER BY hp.dia_semana, hp.hora_inicio`
  );
  return rows;
}

/** Detecta si ese profesor ya tiene algo asignado en esa franja exacta (mismo criterio que el UNIQUE de la tabla, pero da un error entendible en vez de la excepción cruda del constraint). */
export async function buscarAsignacionDeProfesor(profesorId, diaSemana, horaInicio) {
  const { rows } = await pool.query(
    `SELECT * FROM horario_profesores WHERE profesor_id = $1 AND dia_semana = $2 AND hora_inicio = $3`,
    [profesorId, diaSemana, horaInicio]
  );
  return rows[0] ?? null;
}

export async function insertarAsignacionHorarioProfesor(asignacion) {
  const { rows } = await pool.query(
    `INSERT INTO horario_profesores (profesor_id, programa, dia_semana, hora_inicio)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [asignacion.profesorId, asignacion.programa, asignacion.diaSemana, asignacion.horaInicio]
  );
  return rows[0];
}

export async function buscarAsignacionPorId(id) {
  const { rows } = await pool.query(`SELECT * FROM horario_profesores WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function eliminarAsignacionHorarioProfesor(id) {
  await pool.query(`DELETE FROM horario_profesores WHERE id = $1`, [id]);
}
