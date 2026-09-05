import { Router } from "express";
import {
  obtenerRepertorio, editarCancionesDeAlumno,
  obtenerEnsambles, crearEnsambleNuevo, editarEnsambleExistente, eliminarEnsambleExistente,
  agregarEstudianteAEnsamble, quitarEstudianteDeEnsamble,
} from "../../servicios/clausura/servicio.js";
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

// ---- Ensambles: grupos con estudiantes de varios cursos a la vez ----
rutasClausura.get("/ensambles", requierePermiso("clausura:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerEnsambles()); } catch (err) { next(err); }
});

rutasClausura.post("/ensambles", requierePermiso("clausura:editar"), async (req, res, next) => {
  try { respuestaExitosa(res, await crearEnsambleNuevo(req.body, { usuarioId: req.usuario?.id ?? null })); } catch (err) { next(err); }
});

rutasClausura.put("/ensambles/:id", requierePermiso("clausura:editar"), async (req, res, next) => {
  try { respuestaExitosa(res, await editarEnsambleExistente(req.params.id, req.body, { usuarioId: req.usuario?.id ?? null })); } catch (err) { next(err); }
});

rutasClausura.delete("/ensambles/:id", requierePermiso("clausura:editar"), async (req, res, next) => {
  try { await eliminarEnsambleExistente(req.params.id, { usuarioId: req.usuario?.id ?? null }); respuestaExitosa(res, { ok: true }); } catch (err) { next(err); }
});

rutasClausura.post("/ensambles/:id/integrantes", requierePermiso("clausura:editar"), async (req, res, next) => {
  try {
    await agregarEstudianteAEnsamble(req.params.id, req.body.alumnoId, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, { ok: true });
  } catch (err) { next(err); }
});

rutasClausura.delete("/ensambles/:id/integrantes/:alumnoId", requierePermiso("clausura:editar"), async (req, res, next) => {
  try {
    await quitarEstudianteDeEnsamble(req.params.id, req.params.alumnoId, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, { ok: true });
  } catch (err) { next(err); }
});
