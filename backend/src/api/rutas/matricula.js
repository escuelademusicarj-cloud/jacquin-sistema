import { Router } from "express";
import { crearPlanNuevo, obtenerPlanes, inscribirAlumno, obtenerInscripcionesDeAlumno } from "../../servicios/matricula/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasMatricula = Router();
rutasMatricula.use(requiereAutenticacion);

rutasMatricula.get("/planes", requierePermiso("matricula:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerPlanes()); } catch (err) { next(err); }
});

// Autorización fina (solo ADMINISTRADOR) se verifica dentro del servicio,
// no acá — el permiso "matricula:crear" es necesario pero no suficiente.
rutasMatricula.post("/planes", requierePermiso("matricula:crear"), async (req, res, next) => {
  try {
    const plan = await crearPlanNuevo(req.body, { usuarioId: req.usuario?.id, rolId: req.usuario?.rolId });
    respuestaExitosa(res, plan);
  } catch (err) { next(err); }
});

rutasMatricula.post("/inscripciones", requierePermiso("matricula:crear"), async (req, res, next) => {
  try {
    const inscripcion = await inscribirAlumno(req.body, { usuarioId: req.usuario?.id, rolId: req.usuario?.rolId });
    respuestaExitosa(res, inscripcion);
  } catch (err) { next(err); }
});

rutasMatricula.get("/inscripciones/alumno/:alumnoId", requierePermiso("matricula:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerInscripcionesDeAlumno(req.params.alumnoId)); } catch (err) { next(err); }
});
