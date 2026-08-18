import { pool } from "../../config/db.js";

export async function insertarItem(d) {
  const { rows } = await pool.query(
    `INSERT INTO inventario (nombre,categoria,marca,serie,cantidad,estado,ubicacion,fecha,valor,proveedor,responsable,observaciones)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [d.nombre, d.categoria, d.marca, d.serie, d.cantidad, d.estado, d.ubicacion, d.fecha, d.valor, d.proveedor, d.responsable, d.observaciones]
  );
  return rows[0];
}
export async function listarItems() {
  const { rows } = await pool.query(`SELECT * FROM inventario ORDER BY nombre`);
  return rows;
}
export async function actualizarItem(id, d) {
  const { rows } = await pool.query(
    `UPDATE inventario SET nombre=$1,categoria=$2,marca=$3,serie=$4,cantidad=$5,estado=$6,ubicacion=$7,fecha=$8,valor=$9,proveedor=$10,responsable=$11,observaciones=$12 WHERE id=$13 RETURNING *`,
    [d.nombre, d.categoria, d.marca, d.serie, d.cantidad, d.estado, d.ubicacion, d.fecha, d.valor, d.proveedor, d.responsable, d.observaciones, id]
  );
  return rows[0];
}
export async function eliminarItem(id) { await pool.query(`DELETE FROM inventario WHERE id=$1`, [id]); }
