import { pool } from "../../config/db.js";

export async function insertarMensaje({ deUsuarioId, paraTodos, asunto, cuerpo, prioridad }) {
  const { rows } = await pool.query(
    `INSERT INTO mensajes (de_usuario_id, para_todos, asunto, cuerpo, prioridad) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [deUsuarioId, paraTodos, asunto, cuerpo, prioridad]
  );
  return rows[0];
}

export async function insertarDestinatario(mensajeId, usuarioId) {
  await pool.query(`INSERT INTO mensaje_destinatarios (mensaje_id, usuario_id) VALUES ($1,$2)`, [mensajeId, usuarioId]);
}

export async function destinatariosDeMensaje(mensajeId) {
  const { rows } = await pool.query(
    `SELECT md.*, u.email FROM mensaje_destinatarios md JOIN usuarios u ON u.id = md.usuario_id WHERE md.mensaje_id = $1`,
    [mensajeId]
  );
  return rows;
}

// Mensajes recibidos por un usuario: los "para todos" + los dirigidos a él.
export async function mensajesRecibidosPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT DISTINCT m.*, ue.email AS de_email, ue.nombre AS de_nombre,
            (SELECT leido FROM mensaje_destinatarios md WHERE md.mensaje_id = m.id AND md.usuario_id = $1) AS leido_por_mi
     FROM mensajes m
     JOIN usuarios ue ON ue.id = m.de_usuario_id
     LEFT JOIN mensaje_destinatarios md ON md.mensaje_id = m.id
     WHERE m.de_usuario_id != $1 AND (m.para_todos = true OR md.usuario_id = $1)
     ORDER BY m.fecha DESC`,
    [usuarioId]
  );
  return rows;
}

export async function mensajesEnviadosPorUsuario(usuarioId) {
  const { rows } = await pool.query(`SELECT * FROM mensajes WHERE de_usuario_id = $1 ORDER BY fecha DESC`, [usuarioId]);
  return rows;
}

export async function marcarLeido(mensajeId, usuarioId) {
  await pool.query(
    `INSERT INTO mensaje_destinatarios (mensaje_id, usuario_id, leido) VALUES ($1,$2,true)
     ON CONFLICT (mensaje_id, usuario_id) DO UPDATE SET leido = true`,
    [mensajeId, usuarioId]
  );
}
