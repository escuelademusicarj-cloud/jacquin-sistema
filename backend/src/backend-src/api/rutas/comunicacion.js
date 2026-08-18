import { Router } from "express";
import { enviarMensaje, obtenerBandeja, obtenerEnviados, marcarMensajeLeido } from "../../servicios/comunicacion/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasComunicacion = Router();
rutasComunicacion.use(requiereAutenticacion);

rutasComunicacion.get("/bandeja", requierePermiso("comunicacion:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerBandeja(req.usuario.id)); } catch (err) { next(err); }
});

rutasComunicacion.get("/enviados", requierePermiso("comunicacion:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerEnviados(req.usuario.id)); } catch (err) { next(err); }
});

rutasComunicacion.post("/mensajes", requierePermiso("comunicacion:crear"), async (req, res, next) => {
  try {
    const mensaje = await enviarMensaje(req.body, { usuarioId: req.usuario.id });
    respuestaExitosa(res, mensaje);
  } catch (err) { next(err); }
});

rutasComunicacion.patch("/mensajes/:id/leido", requierePermiso("comunicacion:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await marcarMensajeLeido(req.params.id, req.usuario.id)); } catch (err) { next(err); }
});
