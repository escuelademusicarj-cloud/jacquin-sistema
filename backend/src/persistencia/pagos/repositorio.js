import { pool } from "../../config/db.js";

export async function listarConceptos() {
  const { rows } = await pool.query(`SELECT * FROM conceptos_pago WHERE activo = true ORDER BY nombre`);
  return rows;
}

export async function buscarConceptoPorNombre(nombre) {
  const { rows } = await pool.query(`SELECT * FROM conceptos_pago WHERE nombre = $1`, [nombre]);
  return rows[0] ?? null;
}

export async function insertarCargo(cargo) {
  const { rows } = await pool.query(
    `INSERT INTO cargos (alumno_id, concepto_id, inscripcion_id, valor, descuento, saldo_pendiente, fecha_vencimiento, estado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [cargo.alumnoId, cargo.conceptoId, cargo.inscripcionId, cargo.valor, cargo.descuento, cargo.saldoPendiente, cargo.fechaVencimiento, cargo.estado]
  );
  return rows[0];
}

export async function buscarCargoPorId(id) {
  const { rows } = await pool.query(`SELECT * FROM cargos WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function actualizarSaldoCargo(id, saldoPendiente, estado) {
  const { rows } = await pool.query(
    `UPDATE cargos SET saldo_pendiente = $1, estado = $2 WHERE id = $3 RETURNING *`,
    [saldoPendiente, estado, id]
  );
  return rows[0];
}

export async function insertarPago(pago) {
  const { rows } = await pool.query(
    `INSERT INTO pagos (cargo_id, valor, fecha_pago, medio_pago) VALUES ($1,$2,$3,$4) RETURNING *`,
    [pago.cargoId, pago.valor, pago.fechaPago, pago.medioPago]
  );
  return rows[0];
}

export async function cargosDeAlumno(alumnoId) {
  const { rows } = await pool.query(
    `SELECT c.*, cp.nombre AS concepto_nombre FROM cargos c
     JOIN conceptos_pago cp ON cp.id = c.concepto_id
     WHERE c.alumno_id = $1 ORDER BY c.fecha_vencimiento DESC`,
    [alumnoId]
  );
  return rows;
}

/**
 * Cartera: todos los cargos con saldo pendiente, agrupado por alumno.
 * Es la consulta que Sergio pidió como prioridad ("saber quién está al
 * día, quién tiene saldo pendiente, cuánto debe y desde cuándo").
 */
export async function carteraPendiente() {
  const { rows } = await pool.query(
    `SELECT a.id AS alumno_id, a.nombres, a.apellidos,
            SUM(c.saldo_pendiente) AS total_pendiente,
            MIN(c.fecha_vencimiento) AS vencimiento_mas_antiguo
     FROM cargos c
     JOIN alumnos a ON a.id = c.alumno_id
     WHERE c.saldo_pendiente > 0
     GROUP BY a.id, a.nombres, a.apellidos
     ORDER BY vencimiento_mas_antiguo ASC`
  );
  return rows;
}
