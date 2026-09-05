import { Router } from "express";
import { obtenerRepertorio, editarCancionesDeAlumno } from "../../servicios/clausura/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasClausura = Router();
rutasClausura.use(requiereAutenticacion);

// Cualquiera con clausura:ver (Administración, Dirección, Secretaría y
// Profesor tienen este permiso — ver SQL de siembra) puede consultar la
// lista completa de estudiantes con sus canciones ya asignadas. El
// agrupado por curso lo arma el frontend con este mismo resultado.
rutasClausura.get("/", requierePermiso("clausura:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerRepertorio()); } catch (err) { next(err); }
});

// Guarda (o corrige) las canciones de un estudiante de una sola vez.
// Body esperado: { canciones: [{ numero: 1, cancion: '...' }, ...] }
rutasClausura.put("/alumnos/:alumnoId/canciones", requierePermiso("clausura:editar"), async (req, res, next) => {
  try {
    const guardadas = await editarCancionesDeAlumno(req.params.alumnoId, req.body.canciones, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, guardadas);
  } catch (err) { next(err); }
});
