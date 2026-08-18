import { Router } from "express";
import {
  guardarEvaluacionMensual, obtenerEvaluacionesMensuales, borrarEvaluacionMensual,
  guardarEvaluacionIndicadores, obtenerEvaluacionesIndicadores,
} from "../../servicios/avances/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasAvances = Router();
rutasAvances.use(requiereAutenticacion);

rutasAvances.get("/mensual", requierePermiso("avances:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerEvaluacionesMensuales()); } catch (err) { next(err); }
});

rutasAvances.post("/mensual", requierePermiso("avances:crear"), async (req, res, next) => {
  try {
    const guardada = await guardarEvaluacionMensual(req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, guardada);
  } catch (err) { next(err); }
});

rutasAvances.delete("/mensual/:id", requierePermiso("avances:crear"), async (req, res, next) => {
  try {
    const resultado = await borrarEvaluacionMensual(req.params.id, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});

rutasAvances.get("/indicadores", requierePermiso("avances:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerEvaluacionesIndicadores(req.query.alumnoId)); } catch (err) { next(err); }
});

rutasAvances.post("/indicadores", requierePermiso("avances:crear"), async (req, res, next) => {
  try {
    const guardada = await guardarEvaluacionIndicadores(req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, guardada);
  } catch (err) { next(err); }
});
