import { Router } from "express";
import { obtenerConceptos, generarCargo, registrarPago, obtenerCargosDeAlumno, obtenerCartera } from "../../servicios/pagos/servicio.js";
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

rutasPagos.get("/cargos/alumno/:alumnoId", requierePermiso("pagos:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerCargosDeAlumno(req.params.alumnoId)); } catch (err) { next(err); }
});

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
