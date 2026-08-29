import { Router } from "express";
import { altaUsuario, login, bootstrapAdmin, obtenerUsuarios, editarUsuario, borrarUsuario, cambiarMiPassword } from "../../servicios/identidad/servicio.js";
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

// NUEVO: cualquier usuario logueado cambia SU PROPIA contraseña (por
// ejemplo, tras entrar con la contraseña temporal que le dieron al
// crearlo) — no exige ningún permiso especial más allá de estar
// autenticado, porque no es una acción de administración de otros.
rutasIdentidad.post("/mi-password", requiereAutenticacion, async (req, res, next) => {
  try {
    const resultado = await cambiarMiPassword({
      usuarioId: req.usuario.id,
      passwordActual: req.body.passwordActual,
      passwordNueva: req.body.passwordNueva,
    });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});
