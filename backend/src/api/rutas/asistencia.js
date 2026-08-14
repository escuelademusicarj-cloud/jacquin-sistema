import { Router } from "express";
import { registrarAsistencia, obtenerAsistenciaDeClase, obtenerAsistenciaDeAlumno } from "../../servicios/asistencia/servicio.js";
import { ESTADOS_ASISTENCIA } from "../../dominio/asistencia/entidades.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasAsistencia = Router();
rutasAsistencia.use(requiereAutenticacion);

rutasAsistencia.get("/catalogos", requierePermiso("asistencia:ver"), (req, res) => {
  respuestaExitosa(res, { estados: ESTADOS_ASISTENCIA });
});

rutasAsistencia.post("/", requierePermiso("asistencia:crear"), async (req, res, next) => {
  try {
    const resultado = await registrarAsistencia(req.body, { usuarioId: req.usuario.id, rol: req.usuario.rol });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});

rutasAsistencia.get("/clase/:claseId/fecha/:fecha", requierePermiso("asistencia:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerAsistenciaDeClase(req.params.claseId, req.params.fecha, { usuarioId: req.usuario.id, rol: req.usuario.rol })); }
  catch (err) { next(err); }
});

rutasAsistencia.get("/alumno/:alumnoId", requierePermiso("asistencia:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerAsistenciaDeAlumno(req.params.alumnoId, { usuarioId: req.usuario.id, rol: req.usuario.rol })); }
  catch (err) { next(err); }
});
