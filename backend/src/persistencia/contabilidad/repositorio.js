import { pool } from "../../config/db.js";

// ---- Ingresos ----
export async function insertarIngreso(d) {
  const { rows } = await pool.query(
    `INSERT INTO contab_ingresos (fecha,concepto,programa,categoria,cliente,metodo,estado,valor)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [d.fecha, d.concepto, d.programa, d.categoria, d.cliente, d.metodo, d.estado, d.valor]
  );
  return rows[0];
}
export async function listarIngresos() {
  const { rows } = await pool.query(`SELECT * FROM contab_ingresos ORDER BY fecha DESC NULLS LAST, id DESC`);
  return rows;
}
export async function actualizarIngreso(id, d) {
  const { rows } = await pool.query(
    `UPDATE contab_ingresos SET fecha=$1,concepto=$2,programa=$3,categoria=$4,cliente=$5,metodo=$6,estado=$7,valor=$8 WHERE id=$9 RETURNING *`,
    [d.fecha, d.concepto, d.programa, d.categoria, d.cliente, d.metodo, d.estado, d.valor, id]
  );
  return rows[0];
}
export async function eliminarIngreso(id) { await pool.query(`DELETE FROM contab_ingresos WHERE id=$1`, [id]); }

// ---- Gastos ----
export async function insertarGasto(d) {
  const { rows } = await pool.query(
    `INSERT INTO contab_gastos (fecha,concepto,categoria,proveedor,metodo,estado,valor)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [d.fecha, d.concepto, d.categoria, d.proveedor, d.metodo, d.estado, d.valor]
  );
  return rows[0];
}
export async function listarGastos() {
  const { rows } = await pool.query(`SELECT * FROM contab_gastos ORDER BY fecha DESC NULLS LAST, id DESC`);
  return rows;
}
export async function actualizarGasto(id, d) {
  const { rows } = await pool.query(
    `UPDATE contab_gastos SET fecha=$1,concepto=$2,categoria=$3,proveedor=$4,metodo=$5,estado=$6,valor=$7 WHERE id=$8 RETURNING *`,
    [d.fecha, d.concepto, d.categoria, d.proveedor, d.metodo, d.estado, d.valor, id]
  );
  return rows[0];
}
export async function eliminarGasto(id) { await pool.query(`DELETE FROM contab_gastos WHERE id=$1`, [id]); }

// ---- Compras ----
export async function insertarCompra(d) {
  const { rows } = await pool.query(
    `INSERT INTO contab_compras (fecha,articulo,categoria,proveedor,cantidad,valor_unit,valor_total,metodo,estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [d.fecha, d.articulo, d.categoria, d.proveedor, d.cantidad, d.valorUnit, d.valorTotal, d.metodo, d.estado]
  );
  return rows[0];
}
export async function listarCompras() {
  const { rows } = await pool.query(`SELECT * FROM contab_compras ORDER BY fecha DESC NULLS LAST, id DESC`);
  return rows;
}
export async function actualizarCompra(id, d) {
  const { rows } = await pool.query(
    `UPDATE contab_compras SET fecha=$1,articulo=$2,categoria=$3,proveedor=$4,cantidad=$5,valor_unit=$6,valor_total=$7,metodo=$8,estado=$9 WHERE id=$10 RETURNING *`,
    [d.fecha, d.articulo, d.categoria, d.proveedor, d.cantidad, d.valorUnit, d.valorTotal, d.metodo, d.estado, id]
  );
  return rows[0];
}
export async function eliminarCompra(id) { await pool.query(`DELETE FROM contab_compras WHERE id=$1`, [id]); }

// ---- Nómina ----
export async function insertarNomina(d) {
  const { rows } = await pool.query(
    `INSERT INTO contab_nomina (mes,empleado_id,cargo,horas,tarifa,basico,bonos,descuentos,neto,metodo,estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [d.mes, d.empleadoId, d.cargo, d.horas, d.tarifa, d.basico, d.bonos, d.descuentos, d.neto, d.metodo, d.estado]
  );
  return rows[0];
}
export async function listarNomina() {
  const { rows } = await pool.query(`SELECT * FROM contab_nomina ORDER BY mes DESC NULLS LAST, id DESC`);
  return rows;
}
export async function actualizarNomina(id, d) {
  const { rows } = await pool.query(
    `UPDATE contab_nomina SET mes=$1,empleado_id=$2,cargo=$3,horas=$4,tarifa=$5,basico=$6,bonos=$7,descuentos=$8,neto=$9,metodo=$10,estado=$11 WHERE id=$12 RETURNING *`,
    [d.mes, d.empleadoId, d.cargo, d.horas, d.tarifa, d.basico, d.bonos, d.descuentos, d.neto, d.metodo, d.estado, id]
  );
  return rows[0];
}
export async function eliminarNomina(id) { await pool.query(`DELETE FROM contab_nomina WHERE id=$1`, [id]); }
