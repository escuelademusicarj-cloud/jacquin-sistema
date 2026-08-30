import { Router } from "express";
import { obtenerPensum, editarEnlaceDeTema } from "../../servicios/pensum/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasPensum = Router();
rutasPensum.use(requiereAutenticacion);

// Cualquier rol logueado con permiso pensum:ver (los 4 roles lo tienen,
// ver SQL de siembra) puede consultar todo el pensum.
rutasPensum.get("/", requierePermiso("pensum:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerPensum()); } catch (err) { next(err); }
});

// Solo quien tenga pensum:crear (Administración y Dirección, ver SQL de
// siembra) puede agregar o cambiar el enlace de Drive de un tema.
rutasPensum.put("/temas/:id", requierePermiso("pensum:crear"), async (req, res, next) => {
  try {
    const actualizado = await editarEnlaceDeTema(req.params.id, req.body.enlaceDrive, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, actualizado);
  } catch (err) { next(err); }
});
