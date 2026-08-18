import { Router } from "express";
import { obtenerPermisosModulo, actualizarPermisosDeRol } from "../../servicios/permisos/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasPermisos = Router();
rutasPermisos.use(requiereAutenticacion);

rutasPermisos.get("/modulo-rol", requierePermiso("identidad:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerPermisosModulo()); } catch (err) { next(err); }
});

rutasPermisos.put("/modulo-rol/:rolId", requierePermiso("identidad:crear"), async (req, res, next) => {
  try {
    const guardado = await actualizarPermisosDeRol(req.params.rolId, req.body.modulos, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, guardado);
  } catch (err) { next(err); }
});
