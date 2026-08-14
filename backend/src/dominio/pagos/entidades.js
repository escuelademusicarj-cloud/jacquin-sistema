export function crearCargo({ alumnoId, conceptoId, inscripcionId, valor, descuento, fechaVencimiento }) {
  if (!alumnoId) throw new Error("El cargo necesita un alumno.");
  if (!conceptoId) throw new Error("El cargo necesita un concepto de pago.");
  if (valor == null || Number(valor) <= 0) throw new Error("El cargo necesita un valor mayor a cero.");
  if (!fechaVencimiento) throw new Error("El cargo necesita una fecha de vencimiento.");
  const desc = Number(descuento ?? 0);
  const valorNum = Number(valor);
  if (desc < 0 || desc > valorNum) throw new Error("El descuento no puede ser negativo ni mayor al valor del cargo.");
  return {
    alumnoId, conceptoId, inscripcionId: inscripcionId ?? null,
    valor: valorNum, descuento: desc,
    saldoPendiente: valorNum - desc,
    fechaVencimiento,
    estado: "pendiente",
  };
}

/**
 * Calcula el nuevo estado y saldo de un cargo tras registrar un pago.
 * No decide nada sobre la matrícula/alumno — eso lo resuelve el servicio.
 */
export function aplicarPago(cargo, valorPago) {
  const valor = Number(valorPago);
  if (valor <= 0) throw new Error("El pago necesita un valor mayor a cero.");
  if (valor > Number(cargo.saldo_pendiente)) {
    throw new Error("El pago no puede ser mayor al saldo pendiente del cargo.");
  }
  const nuevoSaldo = Number(cargo.saldo_pendiente) - valor;
  const nuevoEstado = nuevoSaldo === 0 ? "pagado" : "parcial";
  return { nuevoSaldo, nuevoEstado };
}
