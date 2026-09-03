// Auditoría: capa transversal. Los Servicios de cada módulo llaman a
// registrarAuditoria() como efecto secundario de su caso de uso — la
// auditoría nunca vive dentro de la lógica propia de un módulo.
// No se registra información sensible (contraseñas, montos exactos
// de pagos, etc.), solo la referencia de qué entidad fue afectada.
import { pool } from "../config/db.js";

export async function registrarAuditoria({ usuarioId, accion, modulo, entidad, entidadId, resultado }) {
  await pool.query(
    `INSERT INTO auditoria_log (usuario_id, accion, modulo, entidad, entidad_id, resultado)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuarioId, accion, modulo, entidad, entidadId, resultado]
  );
}

// Consulta de auditoría para la pantalla "Auditoría" — quién hizo qué en
// el sistema. Filtros opcionales por rol, acción, nombre de usuario
// (ILIKE parcial — sirve para buscar un profesor o alguien del personal
// puntual) y rango de fechas, todos combinables. Trae los 300 registros
// más recientes que calcen — no hay paginación todavía, no hace falta
// con este volumen.
export async function listarAuditoria({ rol, accion, usuario, desde, hasta } = {}) {
  const condiciones = [];
  const valores = [];
  let i = 1;

  if (rol) { condiciones.push(`r.nombre = $${i++}`); valores.push(rol); }
  if (accion) { condiciones.push(`a.accion = $${i++}`); valores.push(accion); }
  if (usuario) { condiciones.push(`u.nombre ILIKE $${i++}`); valores.push(`%${usuario}%`); }
  if (desde) { condiciones.push(`a.fecha_hora >= $${i++}`); valores.push(desde); }
  if (hasta) { condiciones.push(`a.fecha_hora <= $${i++}::date + interval '1 day'`); valores.push(hasta); }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT a.id, a.fecha_hora, a.accion, a.modulo, a.entidad, a.entidad_id, a.resultado,
            u.nombre AS usuario_nombre, u.email AS usuario_email, r.nombre AS usuario_rol
     FROM auditoria_log a
     LEFT JOIN usuarios u ON u.id = a.usuario_id
     LEFT JOIN roles r ON r.id = u.rol_id
     ${where}
     ORDER BY a.fecha_hora DESC
     LIMIT 300`,
    valores
  );
  return rows;
}
