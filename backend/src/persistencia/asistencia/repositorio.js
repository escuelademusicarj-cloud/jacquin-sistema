import { pool } from "../../config/db.js";

export async function insertarOActualizarAsistencia(a) {
  const { rows } = await pool.query(
    `INSERT INTO asistencias (clase_id, alumno_id, fecha, estado, observaciones, registrado_por)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (clase_id, alumno_id, fecha)
     DO UPDATE SET estado = EXCLUDED.estado, observaciones = EXCLUDED.observaciones, registrado_por = EXCLUDED.registrado_por
     RETURNING *`,
    [a.claseId, a.alumnoId, a.fecha, a.estado, a.observaciones, a.registradoPor]
  );
  return rows[0];
}

export async function asistenciasDeClaseYFecha(claseId, fecha) {
  const { rows } = await pool.query(
    `SELECT a.*, al.nombres, al.apellidos FROM asistencias a
     JOIN alumnos al ON al.id = a.alumno_id
     WHERE a.clase_id = $1 AND a.fecha = $2`,
    [claseId, fecha]
  );
  return rows;
}

export async function asistenciasDeAlumno(alumnoId) {
  const { rows } = await pool.query(`SELECT * FROM asistencias WHERE alumno_id = $1 ORDER BY fecha DESC`, [alumnoId]);
  return rows;
}

/** Faltas de los últimos N días — insumo para la alerta por ausencias repetidas. */
export async function faltasRecientes(alumnoId, dias = 30) {
  const { rows } = await pool.query(
    `SELECT * FROM asistencias WHERE alumno_id = $1 AND estado = 'falta' AND fecha >= (CURRENT_DATE - $2::int)`,
    [alumnoId, dias]
  );
  return rows;
}
