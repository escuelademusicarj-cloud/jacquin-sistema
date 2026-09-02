import { Router } from "express";
import {
  obtenerConceptos, generarCargo, editarCargo, registrarPago, obtenerCargosDeAlumno, obtenerCartera,
  borrarCargo, reversarUltimoPago,
} from "../../servicios/pagos/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasPagos = Router();
rutasPagos.use(requiereAutenticacion);

rutasPagos.get("/conceptos", requierePermiso("pagos:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerConceptos()); } catch (err) { next(err); }
});

rutasPagos.post("/cargos", requierePermiso("pagos:crear"), async (req, res, next) => {
  try {
    const cargo = await generarCargo(req.body, { usuarioId: req.usuario?.id, rolId: req.usuario?.rolId });
    respuestaExitosa(res, cargo);
  } catch (err) { next(err); }
});

// NUEVO: edita valor/descuento de un cargo ya creado (ej. asistió solo
// medio mes y le toca pagar menos). Mismo permiso que crear un cargo.
rutasPagos.put("/cargos/:id", requierePermiso("pagos:crear"), async (req, res, next) => {
  try {
    const actualizado = await editarCargo(req.params.id, req.body, { usuarioId: req.usuario?.id, rolId: req.usuario?.rolId });
    respuestaExitosa(res, actualizado);
  } catch (err) { next(err); }
});

// Elimina un cargo sin pagos — el caso real es "el estudiante no asistió
// ese mes, no corresponde cobrarle".
rutasPagos.delete("/cargos/:id", requierePermiso("pagos:crear"), async (req, res, next) => {
  try {
    const resultado = await borrarCargo(req.params.id, { usuarioId: req.usuario?.id, rolId: req.usuario?.rolId });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});

// NUEVO: deshace el pago (abono o pago completo) más reciente de un
// cargo — para cuando se marca "ya pagó" por error.
rutasPagos.delete("/cargos/:id/ultimo-pago", requierePermiso("pagos:crear"), async (req, res, next) => {
  try {
    const actualizado = await reversarUltimoPago(req.params.id, { usuarioId: req.usuario?.id, rolId: req.usuario?.rolId });
    respuestaExitosa(res, actualizado);
  } catch (err) { next(err); }
});

rutasPagos.get("/cargos/alumno/:alumnoId", requierePermiso("pagos:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerCargosDeAlumno(req.params.alumnoId)); } catch (err) { next(err); }
});

// Ya soporta abonos parciales de por sí — si "valor" es menor al saldo
// pendiente, el cargo queda "pendiente" con el saldo ya descontado.
rutasPagos.post("/pagos", requierePermiso("pagos:crear"), async (req, res, next) => {
  try {
    const resultado = await registrarPago(req.body, { usuarioId: req.usuario?.id, rolId: req.usuario?.rolId });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});

// La cartera es justo la prioridad #1 que pidió Sergio: quién debe, cuánto, desde cuándo.
rutasPagos.get("/cartera", requierePermiso("pagos:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerCartera()); } catch (err) { next(err); }
});
