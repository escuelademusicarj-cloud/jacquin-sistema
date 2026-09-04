import { pool } from "../../config/db.js";

export async function obtenerEventoActivo() {
  const { rows } = await pool.query(`SELECT * FROM amigosecreto_eventos WHERE activo = true ORDER BY id DESC LIMIT 1`);
  return rows[0] ?? null;
}

export async function crearOActualizarEvento({ nombre, fechaEvento, presupuestoSugerido, fechaLimiteDeseos }) {
  const existente = await obtenerEventoActivo();
  if (existente) {
    const { rows } = await pool.query(
      `UPDATE amigosecreto_eventos SET nombre=$1, fecha_evento=$2, presupuesto_sugerido=$3, fecha_limite_deseos=$4 WHERE id=$5 RETURNING *`,
      [nombre, fechaEvento, presupuestoSugerido, fechaLimiteDeseos, existente.id]
    );
    return rows[0];
  }
  const { rows } = await pool.query(
    `INSERT INTO amigosecreto_eventos (nombre, fecha_evento, presupuesto_sugerido, fecha_limite_deseos, activo) VALUES ($1,$2,$3,$4,true) RETURNING *`,
    [nombre, fechaEvento, presupuestoSugerido, fechaLimiteDeseos]
  );
  return rows[0];
}

// NUEVO: marca (o desmarca) el evento activo como "revelado" — separado
// del sorteo en sí, para poder armar los cruces con anticipación y
// recién mostrárselos a todos el día que corresponda.
export async function marcarRevelado(eventoId, revelado) {
  const { rows } = await pool.query(
    `UPDATE amigosecreto_eventos SET revelado = $1 WHERE id = $2 RETURNING *`,
    [revelado, eventoId]
  );
  return rows[0];
}

export async function listarParticipantes(eventoId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.usuario_id, u.nombre, u.email, r.nombre AS rol
     FROM amigosecreto_participantes p
     JOIN usuarios u ON u.id = p.usuario_id
     LEFT JOIN roles r ON r.id = u.rol_id
     WHERE p.evento_id = $1 ORDER BY u.nombre`,
    [eventoId]
  );
  return rows;
}

export async function agregarParticipante(eventoId, usuarioId) {
  const { rows } = await pool.query(
    `INSERT INTO amigosecreto_participantes (evento_id, usuario_id) VALUES ($1,$2)
     ON CONFLICT (evento_id, usuario_id) DO NOTHING RETURNING *`,
    [eventoId, usuarioId]
  );
  return rows[0] ?? null;
}

export async function quitarParticipante(eventoId, usuarioId) {
  await pool.query(`DELETE FROM amigosecreto_participantes WHERE evento_id=$1 AND usuario_id=$2`, [eventoId, usuarioId]);
}

export async function borrarCrucesDeEvento(eventoId) {
  await pool.query(`DELETE FROM amigosecreto_cruces WHERE evento_id=$1`, [eventoId]);
}

export async function guardarCruces(eventoId, cruces) {
  for (const c of cruces) {
    await pool.query(
      `INSERT INTO amigosecreto_cruces (evento_id, usuario_id, le_toca_usuario_id) VALUES ($1,$2,$3)`,
      [eventoId, c.usuarioId, c.leTocaUsuarioId]
    );
  }
}

export async function crucesDeEvento(eventoId) {
  const { rows } = await pool.query(
    `SELECT c.usuario_id, u1.nombre AS usuario_nombre,
            c.le_toca_usuario_id, u2.nombre AS le_toca_nombre
     FROM amigosecreto_cruces c
     JOIN usuarios u1 ON u1.id = c.usuario_id
     JOIN usuarios u2 ON u2.id = c.le_toca_usuario_id
     WHERE c.evento_id = $1 ORDER BY u1.nombre`,
    [eventoId]
  );
  return rows;
}

export async function miResultado(eventoId, usuarioId) {
  const { rows } = await pool.query(
    `SELECT c.le_toca_usuario_id, u.nombre, u.email
     FROM amigosecreto_cruces c
     JOIN usuarios u ON u.id = c.le_toca_usuario_id
     WHERE c.evento_id = $1 AND c.usuario_id = $2`,
    [eventoId, usuarioId]
  );
  return rows[0] ?? null;
}

export async function guardarDeseos(eventoId, usuarioId, texto) {
  const { rows } = await pool.query(
    `INSERT INTO amigosecreto_deseos (evento_id, usuario_id, texto) VALUES ($1,$2,$3)
     ON CONFLICT (evento_id, usuario_id) DO UPDATE SET texto = EXCLUDED.texto RETURNING *`,
    [eventoId, usuarioId, texto]
  );
  return rows[0];
}

export async function deseosDeUsuario(eventoId, usuarioId) {
  const { rows } = await pool.query(
    `SELECT texto FROM amigosecreto_deseos WHERE evento_id=$1 AND usuario_id=$2`,
    [eventoId, usuarioId]
  );
  return rows[0] ? rows[0].texto : '';
}
