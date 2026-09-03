import { Router } from "express";
import { listarAuditoria } from "../../auditoria/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasAuditoria = Router();
rutasAuditoria.use(requiereAutenticacion);

// Solo Administración y Dirección (permiso auditoria:ver, ver SQL de siembra).
rutasAuditoria.get("/", requierePermiso("auditoria:ver"), async (req, res, next) => {
  try {
    const filas = await listarAuditoria({
      rol: req.query.rol || undefined,
      accion: req.query.accion || undefined,
      usuario: req.query.usuario || undefined,
      desde: req.query.desde || undefined,
      hasta: req.query.hasta || undefined,
    });
    respuestaExitosa(res, filas);
  } catch (err) { next(err); }
});
