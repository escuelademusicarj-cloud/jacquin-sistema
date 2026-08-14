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
