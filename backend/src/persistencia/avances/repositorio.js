import { pool } from "../../config/db.js";

export async function upsertEvaluacionMensual({ alumnoId, mes, respuestas, observaciones }) {
  const { rows } = await pool.query(
    `INSERT INTO evaluaciones_mensuales (alumno_id, mes, respuestas, observaciones)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (alumno_id, mes)
     DO UPDATE SET respuestas = EXCLUDED.respuestas, observaciones = EXCLUDED.observaciones, fecha = current_date
     RETURNING *`,
    [alumnoId, mes, JSON.stringify(respuestas), observaciones]
  );
  return rows[0];
}

export async function listarEvaluacionesMensuales() {
  const { rows } = await pool.query(`SELECT * FROM evaluaciones_mensuales ORDER BY mes DESC`);
  return rows;
}

export async function eliminarEvaluacionMensual(id) {
  await pool.query(`DELETE FROM evaluaciones_mensuales WHERE id=$1`, [id]);
}

export async function insertarEvaluacionIndicadores({ alumnoId, fecha, indicadores, observaciones }) {
  const { rows } = await pool.query(
    `INSERT INTO evaluaciones_indicadores (alumno_id, fecha, tecnica, ritmo, coordinacion, interpretacion, repertorio, participacion, disciplina, observaciones)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [alumnoId, fecha, indicadores.tecnica, indicadores.ritmo, indicadores.coordinacion, indicadores.interpretacion,
      indicadores.repertorio, indicadores.participacion, indicadores.disciplina, observaciones]
  );
  return rows[0];
}

export async function listarEvaluacionesIndicadores(alumnoId) {
  const { rows } = alumnoId
    ? await pool.query(`SELECT * FROM evaluaciones_indicadores WHERE alumno_id=$1 ORDER BY fecha`, [alumnoId])
    : await pool.query(`SELECT * FROM evaluaciones_indicadores ORDER BY fecha`);
  return rows;
}
