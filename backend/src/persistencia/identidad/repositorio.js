import { pool } from "../../config/db.js";

export async function insertarUsuario({ nombre, email, passwordHash, rolId }) {
  // debe_cambiar_password siempre arranca en true: todo usuario nuevo
  // entra con una contraseña temporal puesta por otra persona (quien lo
  // creó), así que tiene que cambiarla antes de poder usar el sistema.
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol_id, activo, debe_cambiar_password)
     VALUES ($1, $2, $3, $4, true, true)
     RETURNING id, nombre, email, rol_id, activo, debe_cambiar_password, creado_en`,
    [nombre, email, passwordHash, rolId]
  );
  return rows[0];
}

export async function buscarUsuarioPorEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, password_hash, rol_id, activo, debe_cambiar_password FROM usuarios WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function buscarUsuarioPorId(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol_id, activo, debe_cambiar_password, creado_en FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

// Uso interno exclusivo del cambio de contraseña propia (cambiarMiPassword
// en el servicio) — es la única función de este archivo que devuelve
// password_hash junto con el id. NUNCA se debe exponer su resultado
// directamente en una respuesta de la API.
export async function buscarUsuarioPorIdConHash(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, password_hash, rol_id, activo, debe_cambiar_password FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function contarUsuarios() {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM usuarios`);
  return rows[0].total;
}

// Lista completa de usuarios con el nombre de su rol resuelto. Solo los
// activos — un usuario "eliminado" (ver eliminarUsuario) queda desactivado,
// no borrado, así que no debe seguir apareciendo acá.
export async function listarUsuarios() {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.rol_id, r.nombre AS rol, u.activo, u.debe_cambiar_password, u.creado_en
     FROM usuarios u LEFT JOIN roles r ON r.id = u.rol_id
     WHERE u.activo = true
     ORDER BY u.nombre`
  );
  return rows;
}

// Edición parcial — solo pisa los campos que vengan definidos.
export async function actualizarUsuario(id, { nombre, email, rolId, activo }) {
  const actual = await buscarUsuarioPorId(id);
  if (!actual) return null;
  const nuevo = {
    nombre: nombre !== undefined ? nombre : actual.nombre,
    email: email !== undefined ? email : actual.email,
    rolId: rolId !== undefined ? rolId : actual.rol_id,
    activo: activo !== undefined ? activo : actual.activo,
  };
  const { rows } = await pool.query(
    `UPDATE usuarios SET nombre=$1, email=$2, rol_id=$3, activo=$4 WHERE id=$5
     RETURNING id, nombre, email, rol_id, activo, debe_cambiar_password, creado_en`,
    [nuevo.nombre, nuevo.email, nuevo.rolId, nuevo.activo, id]
  );
  return rows[0];
}

// debeCambiarPassword se pasa explícito en cada llamado — true cuando lo
// resetea otra persona (Admin/Profesores → editar), false cuando el
// usuario cambia la suya propia (cambiarMiPassword).
export async function actualizarPasswordUsuario(id, passwordHash, debeCambiarPassword) {
  await pool.query(
    `UPDATE usuarios SET password_hash=$1, debe_cambiar_password=$2 WHERE id=$3`,
    [passwordHash, !!debeCambiarPassword, id]
  );
}

// "Eliminar" un usuario es un borrado lógico (activo=false), no un DELETE
// físico. Un DELETE de verdad choca con auditoria_log_usuario_id_fkey en
// cuanto ese usuario tenga aunque sea un solo login o una sola acción
// registrada — y además borrar la fila real perdería el rastro de
// auditoría de todo lo que esa persona hizo. login() ya respeta "activo",
// así que apenas se desactiva, deja de poder iniciar sesión de inmediato.
export async function eliminarUsuario(id) {
  await pool.query(`UPDATE usuarios SET activo = false WHERE id = $1`, [id]);
}

export async function listarRoles() {
  const { rows } = await pool.query(`SELECT id, nombre, descripcion FROM roles ORDER BY nombre`);
  return rows;
}

export async function buscarRolPorNombre(nombre) {
  const { rows } = await pool.query(`SELECT id, nombre FROM roles WHERE nombre = $1`, [nombre]);
  return rows[0] ?? null;
}

export async function buscarRolPorId(id) {
  const { rows } = await pool.query(`SELECT id, nombre FROM roles WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function insertarRol({ nombre, descripcion }) {
  const { rows } = await pool.query(
    `INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion`,
    [nombre, descripcion]
  );
  return rows[0];
}

export async function permisosDeRol(rolId) {
  const { rows } = await pool.query(
    `SELECT p.clave
     FROM permisos p
     JOIN rol_permisos rp ON rp.permiso_id = p.id
     WHERE rp.rol_id = $1`,
    [rolId]
  );
  return rows.map((r) => r.clave);
}
