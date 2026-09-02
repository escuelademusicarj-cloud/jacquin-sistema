import { pool } from "../../config/db.js";

// ---- Ingresos ----
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

// NUEVO: edita el valor y/o descuento de un cargo ya creado — para el
// caso real de "este mes asistió solo la mitad y le toca pagar menos/más".
// Recalcula el saldo pendiente respetando lo que ya se haya pagado (no
// resetea a cero un abono ya registrado): saldo nuevo = (valor nuevo -
// descuento nuevo) - lo que ya estaba pagado antes de este cambio. Usa
// un WITH para poder referirse a los valores VIEJOS de la fila (valor,
// descuento, saldo_pendiente) dentro del mismo UPDATE.
export async function actualizarCargo(id, { valor, descuento }) {
  const { rows } = await pool.query(
    `WITH calc AS (
       SELECT id, GREATEST($1::numeric - $2::numeric - (valor - descuento - saldo_pendiente), 0) AS nuevo_saldo
       FROM cargos WHERE id = $3
     )
     UPDATE cargos c SET valor = $1, descuento = $2, saldo_pendiente = calc.nuevo_saldo,
            estado = CASE WHEN calc.nuevo_saldo <= 0 THEN 'pagado' ELSE 'pendiente' END
     FROM calc WHERE c.id = calc.id
     RETURNING c.*`,
    [valor, descuento, id]
  );
  return rows[0];
}

// NUEVO: usado por pagosDeCargo/eliminarCargo (ya existían) y ahora
// también por reversarUltimoPago — traer el pago más reciente de un
// cargo, para poder deshacerlo si se marcó "ya pagó" por error.
export async function pagosDeCargo(cargoId) {
  const { rows } = await pool.query(`SELECT * FROM pagos WHERE cargo_id = $1 ORDER BY id DESC`, [cargoId]);
  return rows;
}

export async function ultimoPagoDeCargo(cargoId) {
  const { rows } = await pool.query(`SELECT * FROM pagos WHERE cargo_id = $1 ORDER BY id DESC LIMIT 1`, [cargoId]);
  return rows[0] ?? null;
}

export async function eliminarPago(id) {
  await pool.query(`DELETE FROM pagos WHERE id = $1`, [id]);
}

export async function eliminarCargo(id) {
  await pool.query(`DELETE FROM cargos WHERE id = $1`, [id]);
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

/**
 * Pagos reales registrados dentro de una ventana de fechas (inclusive),
 * con el nombre del alumno y del concepto ya resueltos. fechaInicio y
 * fechaFin van en formato 'YYYY-MM-DD'.
 * Fuente: tabla `pagos` real (cargo_id, valor, fecha_pago, medio_pago),
 * unida con `cargos` (para llegar al alumno) y `conceptos_pago`.
 * Agregado 2026-08-20 para el reporte semanal de Cowork.
 */
export async function pagosDeSemana(fechaInicio, fechaFin) {
  const { rows } = await pool.query(
    `SELECT p.id, p.valor, p.fecha_pago, p.medio_pago,
            a.id AS alumno_id, a.nombres, a.apellidos,
            cp.nombre AS concepto_nombre
     FROM pagos p
     JOIN cargos c ON c.id = p.cargo_id
     JOIN alumnos a ON a.id = c.alumno_id
     JOIN conceptos_pago cp ON cp.id = c.concepto_id
     WHERE p.fecha_pago >= $1 AND p.fecha_pago <= $2
     ORDER BY p.fecha_pago ASC`,
    [fechaInicio, fechaFin]
  );
  return rows;
}
