import { Router } from "express";
import { altaUsuario, login, bootstrapAdmin, obtenerUsuarios, editarUsuario, borrarUsuario } from "../../servicios/identidad/servicio.js";
import { listarRoles } from "../../persistencia/identidad/repositorio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasIdentidad = Router();

rutasIdentidad.post("/login", async (req, res, next) => {
  try {
    const resultado = await login(req.body);
    respuestaExitosa(res, resultado);
  } catch (err) {
    next(err);
  }
});

rutasIdentidad.get("/bootstrap-admin", async (req, res, next) => {
  try {
    const resultado = await bootstrapAdmin();
    respuestaExitosa(res, resultado);
  } catch (err) {
    next(err);
  }
});

rutasIdentidad.get("/roles", requiereAutenticacion, requierePermiso("identidad:ver"), async (req, res, next) => {
  try {
    const roles = await listarRoles();
    respuestaExitosa(res, roles);
  } catch (err) {
    next(err);
  }
});

rutasIdentidad.post("/usuarios", requiereAutenticacion, requierePermiso("identidad:crear"), async (req, res, next) => {
  try {
    const usuario = await altaUsuario(req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, usuario);
  } catch (err) {
    next(err);
  }
});

// NUEVO: listar/editar/eliminar usuarios.
rutasIdentidad.get("/usuarios", requiereAutenticacion, requierePermiso("identidad:ver"), async (req, res, next) => {
  try { respuestaExitosa(res, await obtenerUsuarios()); } catch (err) { next(err); }
});

rutasIdentidad.put("/usuarios/:id", requiereAutenticacion, requierePermiso("identidad:crear"), async (req, res, next) => {
  try {
    const usuario = await editarUsuario(req.params.id, req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, usuario);
  } catch (err) { next(err); }
});

rutasIdentidad.delete("/usuarios/:id", requiereAutenticacion, requierePermiso("identidad:crear"), async (req, res, next) => {
  try {
    const resultado = await borrarUsuario(req.params.id, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});
