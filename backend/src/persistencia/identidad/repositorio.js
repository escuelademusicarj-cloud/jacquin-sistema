// Persistencia: único lugar del proyecto que sabe escribir SQL para
// las tablas de identidad. Los Servicios llaman a estas funciones,
// nunca escriben SQL directamente — así, si el día de mañana
// cambiamos de PostgreSQL a otra base, solo se toca este archivo.
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

export async function contarUsuarios() {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM usuarios`);
  return rows[0].total;
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
