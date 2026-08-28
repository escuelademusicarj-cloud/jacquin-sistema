import { Router } from "express";
import { obtenerPermisosModulo, actualizarPermisosDeRol } from "../../servicios/permisos/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasPermisos = Router();
rutasPermisos.use(requiereAutenticacion);

// GET: cualquier rol logueado necesita poder leer qué módulos le
// corresponden a SU PROPIO rol para armar su menú (Inicio, Horarios,
// Asistencia, etc.) — no es una acción de administración, es lectura de
// datos propios. Antes exigía "identidad:ver" (permiso que Profesor no
// tiene), así que /api/permisos/modulo-rol le devolvía 403 a cualquier
// Profesor: su navegador nunca podía leer lo que Administración guardó
// para su rol, aunque el guardado en la base de datos sí funcionaba bien.
// Con requiereAutenticacion (ya aplicado arriba con .use()) alcanza:
// cualquiera que esté logueado puede leer la matriz completa de permisos.
rutasPermisos.get("/modulo-rol", async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerPermisosModulo()); } catch (err) { next(err); }
});

// PUT sigue exigiendo identidad:crear — editar los permisos de un rol
// sigue siendo exclusivo de quien pueda administrar identidad (Administración).
rutasPermisos.put("/modulo-rol/:rolId", requierePermiso("identidad:crear"), async (req, res, next) => {
  try {
    const guardado = await actualizarPermisosDeRol(req.params.rolId, req.body.modulos, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, guardado);
  } catch (err) { next(err); }
});
