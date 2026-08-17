import { Router } from "express";
import {
  crearEventoNuevo, obtenerEventos, editarEvento, cambiarEstado, borrarEvento,
  marcarInvitacionEnviada, marcarConfirmado,
} from "../../servicios/eventos/servicio.js";
import { TIPOS_EVENTO, ESTADOS_EVENTO } from "../../dominio/eventos/entidades.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasEventos = Router();
rutasEventos.use(requiereAutenticacion);

rutasEventos.get("/catalogos", requierePermiso("eventos:ver"), (req, res) => {
  respuestaExitosa(res, { tipos: TIPOS_EVENTO, estados: ESTADOS_EVENTO });
});

rutasEventos.get("/", requierePermiso("eventos:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerEventos()); } catch (err) { next(err); }
});

rutasEventos.post("/", requierePermiso("eventos:crear"), async (req, res, next) => {
  try {
    const evento = await crearEventoNuevo(req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, evento);
  } catch (err) { next(err); }
});

rutasEventos.put("/:id", requierePermiso("eventos:crear"), async (req, res, next) => {
  try {
    const evento = await editarEvento(req.params.id, req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, evento);
  } catch (err) { next(err); }
});

rutasEventos.patch("/:id/estado", requierePermiso("eventos:crear"), async (req, res, next) => {
  try {
    const evento = await cambiarEstado(req.params.id, req.body.estado, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, evento);
  } catch (err) { next(err); }
});

rutasEventos.delete("/:id", requierePermiso("eventos:crear"), async (req, res, next) => {
  try {
    const resultado = await borrarEvento(req.params.id, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});

// Marcar que se le mandó la invitación por WhatsApp a un invitado puntual.
rutasEventos.patch("/invitados/:invitadoId/enviado", requierePermiso("eventos:crear"), async (req, res, next) => {
  try { respuestaExitosa(res, await marcarInvitacionEnviada(req.params.invitadoId)); } catch (err) { next(err); }
});

// Marcar (o desmarcar) que un invitado confirmó asistencia.
rutasEventos.patch("/invitados/:invitadoId/confirmado", requierePermiso("eventos:crear"), async (req, res, next) => {
  try { respuestaExitosa(res, await marcarConfirmado(req.params.invitadoId, req.body.confirmado)); } catch (err) { next(err); }
});
