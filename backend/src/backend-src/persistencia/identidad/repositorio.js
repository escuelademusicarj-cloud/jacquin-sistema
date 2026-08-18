import { pool } from "../../config/db.js";

export async function insertarUsuario({ nombre, email, passwordHash, rolId }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol_id, activo)
     VALUES ($1, $2, $3, $4, true)
     RETURNING id, nombre, email, rol_id, activo, creado_en`,
    [nombre, email, passwordHash, rolId]
  );
  return rows[0];
}

export async function buscarUsuarioPorEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, password_hash, rol_id, activo FROM usuarios WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function buscarUsuarioPorId(id) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, rol_id, activo, creado_en FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function contarUsuarios() {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM usuarios`);
  return rows[0].total;
}

// NUEVO: lista completa de usuarios con el nombre de su rol resuelto.
export async function listarUsuarios() {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.rol_id, r.nombre AS rol, u.activo, u.creado_en
     FROM usuarios u LEFT JOIN roles r ON r.id = u.rol_id
     ORDER BY u.nombre`
  );
  return rows;
}

// NUEVO: edición parcial — solo pisa los campos que vengan definidos.
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
     RETURNING id, nombre, email, rol_id, activo, creado_en`,
    [nuevo.nombre, nuevo.email, nuevo.rolId, nuevo.activo, id]
  );
  return rows[0];
}

export async function actualizarPasswordUsuario(id, passwordHash) {
  await pool.query(`UPDATE usuarios SET password_hash=$1 WHERE id=$2`, [passwordHash, id]);
}

export async function eliminarUsuario(id) {
  await pool.query(`DELETE FROM usuarios WHERE id=$1`, [id]);
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
