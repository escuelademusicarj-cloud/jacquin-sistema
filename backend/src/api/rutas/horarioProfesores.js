import { Router } from "express";
import { obtenerHorarioProfesores, asignarProfesorAHorario, quitarProfesorDeHorario } from "../../servicios/horarioProfesores/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasHorarioProfesores = Router();
rutasHorarioProfesores.use(requiereAutenticacion);

rutasHorarioProfesores.get("/", requierePermiso("horarioprofesores:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerHorarioProfesores()); } catch (err) { next(err); }
});

rutasHorarioProfesores.post("/", requierePermiso("horarioprofesores:crear"), async (req, res, next) => {
  try {
    const asignacion = await asignarProfesorAHorario(req.body, { usuarioId: req.usuario?.id });
    respuestaExitosa(res, asignacion);
  } catch (err) { next(err); }
});

rutasHorarioProfesores.delete("/:id", requierePermiso("horarioprofesores:crear"), async (req, res, next) => {
  try {
    const resultado = await quitarProfesorDeHorario(req.params.id, { usuarioId: req.usuario?.id });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});
