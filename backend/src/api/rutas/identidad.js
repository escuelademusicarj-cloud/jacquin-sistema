import { Router } from "express";
import { altaUsuario, login, bootstrapAdmin } from "../../servicios/identidad/servicio.js";
import { listarRoles } from "../../persistencia/identidad/repositorio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasIdentidad = Router();

// Único endpoint público del módulo — todos los demás requieren sesión.
rutasIdentidad.post("/login", async (req, res, next) => {
  try {
    const resultado = await login(req.body);
    respuestaExitosa(res, resultado);
  } catch (err) {
    next(err);
  }
});

// Bootstrap de un solo uso — se autodesactiva apenas existe un usuario.
// Pensado para crear el primer admin sin terminal, visitando la URL.
rutasIdentidad.get("/bootstrap-admin", async (req, res, next) => {
  try {
    const resultado = await bootstrapAdmin();
    respuestaExitosa(res, resultado);
  } catch (err) {
    next(err);
  }
});

// Nomenclatura: /api/identidad/<recurso>
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
