import { Router } from "express";
import {
  obtenerLlegadasDelDia, registrarLlegada, registrarNoAsistio, corregirLlegada, editarObservacion, obtenerReporteMensual,
} from "../../servicios/llegadas/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasLlegadas = Router();
rutasLlegadas.use(requiereAutenticacion);

const contexto = (req) => ({ usuarioId: req.usuario?.id ?? null, rol: req.usuario?.rol ?? null });

// Lista del día (por defecto hoy en hora de Colombia): ?fecha=AAAA-MM-DD
rutasLlegadas.get("/", requierePermiso("llegadas:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerLlegadasDelDia(req.query.fecha)); } catch (err) { next(err); }
});

// Reporte mensual de una persona: ?usuarioId=..&mes=AAAA-MM
rutasLlegadas.get("/reporte", requierePermiso("llegadas:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerReporteMensual(req.query.usuarioId, req.query.mes)); } catch (err) { next(err); }
});

// Un clic = llegada de HOY con la hora del servidor. No recibe hora del navegador.
rutasLlegadas.post("/:usuarioId/registrar", requierePermiso("llegadas:registrar"), async (req, res, next) => {
  try { respuestaExitosa(res, await registrarLlegada(req.params.usuarioId, contexto(req))); } catch (err) { next(err); }
});

// Marca "No asistió". Body opcional: { fecha: 'AAAA-MM-DD' } (por defecto hoy;
// días anteriores solo Administración).
rutasLlegadas.post("/:usuarioId/no-asistio", requierePermiso("llegadas:registrar"), async (req, res, next) => {
  try { respuestaExitosa(res, await registrarNoAsistio(req.params.usuarioId, req.body?.fecha, contexto(req))); } catch (err) { next(err); }
});

// Corregir = quitar la hora (o el "No asistió") registrada ese día (?fecha=AAAA-MM-DD).
rutasLlegadas.delete("/:usuarioId/hora", requierePermiso("llegadas:registrar"), async (req, res, next) => {
  try { respuestaExitosa(res, await corregirLlegada(req.params.usuarioId, req.query.fecha, contexto(req))); } catch (err) { next(err); }
});

// Body: { fecha: 'AAAA-MM-DD', observaciones: '...' }
rutasLlegadas.put("/:usuarioId/observaciones", requierePermiso("llegadas:registrar"), async (req, res, next) => {
  try {
    respuestaExitosa(res, await editarObservacion(req.params.usuarioId, req.body?.fecha, req.body?.observaciones, contexto(req)));
  } catch (err) { next(err); }
});
