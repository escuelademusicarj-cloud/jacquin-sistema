// Persistencia: la única capa que toca SQL directamente — mismo
// criterio que el resto del proyecto (un pool único importado desde
// config/db.js, nunca uno propio).
import { pool } from "../../config/db.js";

export async function insertarEvento(datos) {
  const { rows } = await pool.query(
    `insert into eventos (tipo, titulo, fecha, hora, lugar, notas, profesor_responsable_id, estado)
     values ($1,$2,$3,$4,$5,$6,$7,$8) returning *`,
    [datos.tipo, datos.titulo, datos.fecha, datos.hora, datos.lugar, datos.notas, datos.profesorResponsableId, datos.estado]
  );
  return rows[0];
}

export async function listarEventos() {
  const { rows } = await pool.query(`select * from eventos order by fecha asc`);
  return rows;
}

export async function buscarEventoPorId(id) {
  const { rows } = await pool.query(`select * from eventos where id = $1`, [id]);
  return rows[0] || null;
}

export async function actualizarEvento(id, datos) {
  const { rows } = await pool.query(
    `update eventos set tipo=$1, titulo=$2, fecha=$3, hora=$4, lugar=$5, notas=$6, profesor_responsable_id=$7
     where id=$8 returning *`,
    [datos.tipo, datos.titulo, datos.fecha, datos.hora, datos.lugar, datos.notas, datos.profesorResponsableId, id]
  );
  return rows[0];
}

export async function actualizarEstadoEvento(id, estado) {
  const { rows } = await pool.query(`update eventos set estado=$1 where id=$2 returning *`, [estado, id]);
  return rows[0];
}

export async function eliminarEvento(id) {
  // ON DELETE CASCADE en evento_invitados se encarga de los invitados.
  await pool.query(`delete from eventos where id=$1`, [id]);
}

export async function insertarInvitado(datos) {
  const { rows } = await pool.query(
    `insert into evento_invitados (evento_id, tipo, alumno_id, usuario_id, invitacion_enviada, fecha_envio, confirmado)
     values ($1,$2,$3,$4,$5,$6,$7) returning *`,
    [datos.eventoId, datos.tipo, datos.alumnoId, datos.usuarioId, datos.invitacionEnviada, datos.fechaEnvio, datos.confirmado]
  );
  return rows[0];
}

export async function invitadosDeEvento(eventoId) {
  const { rows } = await pool.query(`select * from evento_invitados where evento_id=$1`, [eventoId]);
  return rows;
}

export async function buscarInvitadoPorId(id) {
  const { rows } = await pool.query(`select * from evento_invitados where id=$1`, [id]);
  return rows[0] || null;
}

// Update parcial: solo pisa los campos que vienen en "cambios", conserva
// el resto tal cual estaban (por ejemplo, marcar "confirmado" no debe
// borrar "invitacion_enviada" ni al revés).
export async function actualizarInvitado(id, cambios) {
  const actual = await buscarInvitadoPorId(id);
  if (!actual) return null;
  const nuevo = Object.assign({}, actual, cambios);
  const { rows } = await pool.query(
    `update evento_invitados set invitacion_enviada=$1, fecha_envio=$2, confirmado=$3 where id=$4 returning *`,
    [nuevo.invitacion_enviada, nuevo.fecha_envio, nuevo.confirmado, id]
  );
  return rows[0];
}
