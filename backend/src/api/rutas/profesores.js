import { Router } from "express";
import { actualizarPerfil, obtenerProfesores, agregarDisponibilidad, obtenerDisponibilidad } from "../../servicios/profesores/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasProfesores = Router();
rutasProfesores.use(requiereAutenticacion);

rutasProfesores.get("/", requierePermiso("profesores:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerProfesores()); } catch (err) { next(err); }
});

rutasProfesores.put("/:usuarioId/perfil", requierePermiso("profesores:crear"), async (req, res, next) => {
  try {
    const perfil = await actualizarPerfil({ usuarioId: req.params.usuarioId, ...req.body }, { usuarioId: req.usuario.id, rol: req.usuario.rol });
    respuestaExitosa(res, perfil);
  } catch (err) { next(err); }
});

rutasProfesores.post("/:usuarioId/disponibilidad", requierePermiso("profesores:crear"), async (req, res, next) => {
  try {
    const disp = await agregarDisponibilidad({ usuarioId: req.params.usuarioId, ...req.body }, { usuarioId: req.usuario.id, rol: req.usuario.rol });
    respuestaExitosa(res, disp);
  } catch (err) { next(err); }
});

rutasProfesores.get("/:usuarioId/disponibilidad", requierePermiso("profesores:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerDisponibilidad(req.params.usuarioId)); } catch (err) { next(err); }
});
