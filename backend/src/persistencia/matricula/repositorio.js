import { pool } from "../../config/db.js";

export async function insertarPlan(plan) {
  const { rows } = await pool.query(
    `INSERT INTO planes (nombre, programa, horas_semanales, valor) VALUES ($1,$2,$3,$4) RETURNING *`,
    [plan.nombre, plan.programa, plan.horasSemanales, plan.valor]
  );
  return rows[0];
}

export async function listarPlanes({ soloActivos = true } = {}) {
  const sql = soloActivos ? `SELECT * FROM planes WHERE activo = true ORDER BY programa, nombre` : `SELECT * FROM planes ORDER BY programa, nombre`;
  const { rows } = await pool.query(sql);
  return rows;
}

export async function buscarPlanPorId(id) {
  const { rows } = await pool.query(`SELECT * FROM planes WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insertarInscripcion(inscripcion) {
  const { rows } = await pool.query(
    `INSERT INTO inscripciones (alumno_id, plan_id, fecha_inicio, estado) VALUES ($1,$2,$3,$4) RETURNING *`,
    [inscripcion.alumnoId, inscripcion.planId, inscripcion.fechaInicio, inscripcion.estado]
  );
  return rows[0];
}

export async function insertarEventoInscripcion({ inscripcionId, evento, detalle }) {
  await pool.query(
    `INSERT INTO inscripcion_historial (inscripcion_id, evento, detalle) VALUES ($1,$2,$3)`,
    [inscripcionId, evento, detalle ?? null]
  );
}

export async function inscripcionesDeAlumno(alumnoId) {
  const { rows } = await pool.query(
    `SELECT i.*, p.nombre AS plan_nombre, p.programa, p.valor
     FROM inscripciones i JOIN planes p ON p.id = i.plan_id
     WHERE i.alumno_id = $1 ORDER BY i.creado_en DESC`,
    [alumnoId]
  );
  return rows;
}
