import { Router } from "express";
import { obtenerSalas, crearClaseNueva, obtenerClases, registrarModificacion, obtenerAlumnosDeClase } from "../../servicios/horarios/servicio.js";
import { DIAS_SEMANA, MAX_RECUPERACIONES_POR_MES } from "../../dominio/horarios/entidades.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasHorarios = Router();
rutasHorarios.use(requiereAutenticacion);

rutasHorarios.get("/catalogos", requierePermiso("horarios:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, { salas: await obtenerSalas(), dias: DIAS_SEMANA, maxRecuperacionesPorMes: MAX_RECUPERACIONES_POR_MES }); }
  catch (err) { next(err); }
});

rutasHorarios.get("/clases", requierePermiso("horarios:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerClases({ alumnoId: req.query.alumnoId }, { rol: req.usuario.rol, usuarioId: req.usuario.id })); }
  catch (err) { next(err); }
});

// NUEVO: alumnos de una clase puntual — antes no había forma de releer esto.
rutasHorarios.get("/clases/:id/alumnos", requierePermiso("horarios:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerAlumnosDeClase(req.params.id)); }
  catch (err) { next(err); }
});

rutasHorarios.post("/clases", requierePermiso("horarios:crear"), async (req, res, next) => {
  try {
    const clase = await crearClaseNueva(req.body, { usuarioId: req.usuario?.id });
    respuestaExitosa(res, clase);
  } catch (err) { next(err); }
});

// Cancelar / reprogramar / recuperar una clase en una fecha puntual.
rutasHorarios.post("/clases/:id/modificaciones", requierePermiso("horarios:crear"), async (req, res, next) => {
  try {
    const mod = await registrarModificacion({ claseId: req.params.id, ...req.body }, { usuarioId: req.usuario?.id });
    respuestaExitosa(res, mod);
  } catch (err) { next(err); }
});
