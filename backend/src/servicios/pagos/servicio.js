import { crearCargo, aplicarPago } from "../../dominio/pagos/entidades.js";
import {
  insertarCargo, buscarCargoPorId, actualizarSaldoCargo, actualizarCargo, insertarPago, cargosDeAlumno,
  carteraPendiente, listarConceptos, buscarConceptoPorNombre, pagosDeCargo, eliminarCargo, ultimoPagoDeCargo, eliminarPago,
} from "../../persistencia/pagos/repositorio.js";
import { cambiarEstado } from "../academico/servicio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerConceptos() {
  return listarConceptos();
}

export async function obtenerConceptoPorNombre(nombre) {
  return buscarConceptoPorNombre(nombre);
}

export async function generarCargo(datosCargo, contextoAuditoria) {
  const datos = crearCargo(datosCargo);
  const cargo = await insertarCargo(datos);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "pagos",
    entidad: "cargo", entidadId: cargo.id, resultado: "exito",
  });
  return cargo;
}

/**
 * Edita el valor y/o descuento de un cargo ya existente — caso real:
 * "este mes el estudiante asistió solo la mitad, le toca pagar menos".
 * El saldo se recalcula respetando lo que ya estuviera pagado (no borra
 * abonos ya registrados), ver actualizarCargo() en el repositorio.
 */
export async function editarCargo(id, { valor, descuento }, contextoAuditoria) {
  const cargo = await buscarCargoPorId(id);
  if (!cargo) {
    const err = new Error("Cargo no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }
  if (valor == null || valor < 0) throw new Error("El valor debe ser un número válido.");
  const descuentoFinal = descuento != null ? descuento : 0;
  if (descuentoFinal > valor) throw new Error("El descuento no puede ser mayor al valor.");

  const actualizado = await actualizarCargo(id, { valor, descuento: descuentoFinal });
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "pagos",
    entidad: "cargo", entidadId: id, resultado: "exito",
  });
  return actualizado;
}

/**
 * Elimina un cargo que todavía no tiene ningún pago registrado en su
 * contra — pensado para el caso real que describió Sergio: el estudiante
 * no asistió ese mes, así que ese cargo no corresponde y Secretaría lo
 * saca a mano. Si el cargo ya tiene algún pago (aunque sea parcial), no
 * se deja borrar — ahí lo correcto sería un ajuste contable, no hacer
 * desaparecer el registro de un pago real.
 */
export async function borrarCargo(id, contextoAuditoria) {
  const cargo = await buscarCargoPorId(id);
  if (!cargo) {
    const err = new Error("Cargo no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }
  const pagosDelCargo = await pagosDeCargo(id);
  if (pagosDelCargo.length > 0) {
    const err = new Error("Este cargo ya tiene pagos registrados — no se puede eliminar.");
    err.codigoHttp = 400;
    throw err;
  }
  await eliminarCargo(id);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "pagos",
    entidad: "cargo", entidadId: id, resultado: "exito",
  });
  return { eliminado: true };
}

/**
 * Registra un pago contra un cargo. Si el cargo queda saldado Y estaba
 * ligado a una inscripción (matrícula), el alumno pasa a "activo" —
 * esto cierra el flujo real que describió Sergio: matrícula → pago →
 * alumno activo. No se activa antes de tiempo. Ya soporta abonos
 * parciales de por sí (aplicarPago calcula el saldo restante; si el
 * valor pagado es menor al saldo, el cargo queda en "pendiente" con el
 * saldo ya descontado, no en "pagado").
 */
export async function registrarPago({ cargoId, valor, fechaPago, medioPago }, contextoAuditoria) {
  const cargo = await buscarCargoPorId(cargoId);
  if (!cargo) throw new Error("Cargo no encontrado.");
  if (cargo.estado === "pagado") throw new Error("Este cargo ya está saldado.");

  const { nuevoSaldo, nuevoEstado } = aplicarPago(cargo, valor);
  const pago = await insertarPago({ cargoId, valor, fechaPago, medioPago });
  const cargoActualizado = await actualizarSaldoCargo(cargoId, nuevoSaldo, nuevoEstado);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "pagos",
    entidad: "pago", entidadId: pago.id, resultado: "exito",
  });

  if (nuevoEstado === "pagado" && cargo.inscripcion_id) {
    await cambiarEstado(
      { alumnoId: cargo.alumno_id, estadoNuevo: "activo", motivo: `Cargo #${cargo.id} saldado — matrícula confirmada` },
      contextoAuditoria
    );
  }

  return { pago, cargo: cargoActualizado };
}

/**
 * Deshace el pago más reciente de un cargo (un abono o un "ya pagó" que
 * se marcó por error) — le devuelve ese monto al saldo pendiente y el
 * cargo vuelve a quedar en "pendiente".
 */
export async function reversarUltimoPago(cargoId, contextoAuditoria) {
  const cargo = await buscarCargoPorId(cargoId);
  if (!cargo) {
    const err = new Error("Cargo no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }
  const ultimoPago = await ultimoPagoDeCargo(cargoId);
  if (!ultimoPago) {
    throw new Error("Este cargo no tiene ningún pago registrado para deshacer.");
  }
  const nuevoSaldo = Number(cargo.saldo_pendiente) + Number(ultimoPago.valor);
  await eliminarPago(ultimoPago.id);
  const cargoActualizado = await actualizarSaldoCargo(cargoId, nuevoSaldo, "pendiente");

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "pagos",
    entidad: "pago", entidadId: ultimoPago.id, resultado: "exito",
  });

  return cargoActualizado;
}

export async function obtenerCargosDeAlumno(alumnoId) {
  return cargosDeAlumno(alumnoId);
}

export async function obtenerCartera() {
  return carteraPendiente();
}
