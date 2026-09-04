import { Router } from "express";
import {
  obtenerEventoParaMostrar, configurarEvento, listarParticipantesDelEvento, agregarParticipante,
  quitarParticipante, realizarSorteo, revelarResultados, obtenerMiResultado, obtenerTodosLosCruces,
  guardarMisDeseos, obtenerMisDeseos,
} from "../../servicios/amigosecreto/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasAmigoSecreto = Router();
rutasAmigoSecreto.use(requiereAutenticacion);

rutasAmigoSecreto.get("/evento", requierePermiso("amigosecreto:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerEventoParaMostrar()); } catch (err) { next(err); }
});

rutasAmigoSecreto.post("/evento", requierePermiso("amigosecreto:admin"), async (req, res, next) => {
  try { respuestaExitosa(res, await configurarEvento(req.body, { usuarioId: req.usuario?.id })); } catch (err) { next(err); }
});

rutasAmigoSecreto.get("/participantes", requierePermiso("amigosecreto:admin"), async (req, res, next) => {
  try { respuestaExitosa(res, await listarParticipantesDelEvento()); } catch (err) { next(err); }
});

rutasAmigoSecreto.post("/participantes", requierePermiso("amigosecreto:admin"), async (req, res, next) => {
  try { respuestaExitosa(res, await agregarParticipante(req.body.usuarioId, { usuarioId: req.usuario?.id })); } catch (err) { next(err); }
});

rutasAmigoSecreto.delete("/participantes/:usuarioId", requierePermiso("amigosecreto:admin"), async (req, res, next) => {
  try { respuestaExitosa(res, await quitarParticipante(req.params.usuarioId, { usuarioId: req.usuario?.id })); } catch (err) { next(err); }
});

// Sorteo: borra los cruces anteriores del evento activo y arma unos
// nuevos, al azar, sin que nadie se saque a sí mismo. NO los revela.
rutasAmigoSecreto.post("/sortear", requierePermiso("amigosecreto:admin"), async (req, res, next) => {
  try { respuestaExitosa(res, await realizarSorteo({ usuarioId: req.usuario?.id })); } catch (err) { next(err); }
});

// NUEVO: revela (o vuelve a ocultar) los resultados a todos los
// participantes — separado del sorteo en sí.
rutasAmigoSecreto.post("/revelar", requierePermiso("amigosecreto:admin"), async (req, res, next) => {
  try { respuestaExitosa(res, await revelarResultados(req.body.revelado, { usuarioId: req.usuario?.id })); } catch (err) { next(err); }
});

// Cada quien ve solo lo suyo, y solo si ya está revelado.
rutasAmigoSecreto.get("/mi-resultado", requierePermiso("amigosecreto:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerMiResultado(req.usuario.id)); } catch (err) { next(err); }
});

// Solo Administración ve todos los cruces (aunque no estén revelados).
rutasAmigoSecreto.get("/cruces", requierePermiso("amigosecreto:admin"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerTodosLosCruces()); } catch (err) { next(err); }
});

rutasAmigoSecreto.get("/mis-deseos", requierePermiso("amigosecreto:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerMisDeseos(req.usuario.id)); } catch (err) { next(err); }
});

rutasAmigoSecreto.post("/mis-deseos", requierePermiso("amigosecreto:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await guardarMisDeseos(req.usuario.id, req.body.texto)); } catch (err) { next(err); }
});
