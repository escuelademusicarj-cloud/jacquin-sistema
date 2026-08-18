import { pool } from "../../config/db.js";

export async function listarPermisosModuloPorRol() {
  const { rows } = await pool.query(
    `SELECT pmr.rol_id, r.nombre AS rol, pmr.modulo_clave FROM permisos_modulo_rol pmr JOIN roles r ON r.id = pmr.rol_id`
  );
  return rows;
}

// Reemplaza TODA la lista de módulos visibles de un rol (borra e inserta de nuevo).
export async function reemplazarModulosDeRol(rolId, modulos) {
  await pool.query(`DELETE FROM permisos_modulo_rol WHERE rol_id = $1`, [rolId]);
  for (const clave of modulos) {
    await pool.query(`INSERT INTO permisos_modulo_rol (rol_id, modulo_clave) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [rolId, clave]);
  }
  return modulos;
}
