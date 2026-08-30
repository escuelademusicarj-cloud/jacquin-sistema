import { pool } from "../../config/db.js";

// Trae TODO el pensum de una — niveles, secciones y temas ya anidados,
// para que el frontend arme las tarjetas con un solo pedido al backend.
export async function listarPensumCompleto() {
  const niveles = (await pool.query(
    `SELECT id, programa, nivel, resumen FROM pensum_niveles ORDER BY programa, nivel`
  )).rows;

  const secciones = (await pool.query(
    `SELECT id, nivel_id, orden, titulo FROM pensum_secciones ORDER BY nivel_id, orden`
  )).rows;

  const temas = (await pool.query(
    `SELECT id, seccion_id, orden, titulo, enlace_drive FROM pensum_temas ORDER BY seccion_id, orden`
  )).rows;

  const temasPorSeccion = {};
  for (const t of temas) {
    if (!temasPorSeccion[t.seccion_id]) temasPorSeccion[t.seccion_id] = [];
    temasPorSeccion[t.seccion_id].push(t);
  }

  const seccionesPorNivel = {};
  for (const s of secciones) {
    const conTemas = { ...s, temas: temasPorSeccion[s.id] || [] };
    if (!seccionesPorNivel[s.nivel_id]) seccionesPorNivel[s.nivel_id] = [];
    seccionesPorNivel[s.nivel_id].push(conTemas);
  }

  return niveles.map((n) => ({ ...n, secciones: seccionesPorNivel[n.id] || [] }));
}

export async function buscarTemaPorId(id) {
  const { rows } = await pool.query(`SELECT id, seccion_id, titulo, enlace_drive FROM pensum_temas WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function actualizarEnlaceTema(id, enlaceDrive) {
  const { rows } = await pool.query(
    `UPDATE pensum_temas SET enlace_drive = $1 WHERE id = $2 RETURNING id, seccion_id, orden, titulo, enlace_drive`,
    [enlaceDrive, id]
  );
  return rows[0] ?? null;
}
