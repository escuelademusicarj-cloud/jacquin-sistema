import { Router } from "express";
import { crearItemNuevo, obtenerItems, editarItem, borrarItem } from "../../servicios/inventario/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasInventario = Router();
rutasInventario.use(requiereAutenticacion);

rutasInventario.get("/", requierePermiso("inventario:ver"), async (req, res, next) => { try { respuestaExitosa(res, await obtenerItems()); } catch (e) { next(e); } });
rutasInventario.post("/", requierePermiso("inventario:crear"), async (req, res, next) => { try { respuestaExitosa(res, await crearItemNuevo(req.body, { usuarioId: req.usuario?.id })); } catch (e) { next(e); } });
rutasInventario.put("/:id", requierePermiso("inventario:crear"), async (req, res, next) => { try { respuestaExitosa(res, await editarItem(req.params.id, req.body, { usuarioId: req.usuario?.id })); } catch (e) { next(e); } });
rutasInventario.delete("/:id", requierePermiso("inventario:crear"), async (req, res, next) => { try { respuestaExitosa(res, await borrarItem(req.params.id, { usuarioId: req.usuario?.id })); } catch (e) { next(e); } });
