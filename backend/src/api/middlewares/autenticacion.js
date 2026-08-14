// Autenticación (Fase 1 — ya funcional). Verifica el token del header
// Authorization y adjunta req.usuario para que el resto de la cadena
// (autorización, servicios) sepa quién hace el pedido — incluido el
// NOMBRE del rol, no solo su id, porque el filtrado por fila (ej.
// "un profesor solo ve sus propios estudiantes") necesita saber si es
// PROFESOR, no solo un número.
import jwt from "jsonwebtoken";
import { buscarRolPorId } from "../../persistencia/identidad/repositorio.js";

function noAutenticado() {
  const err = new Error("Falta autenticación o el token no es válido.");
  err.codigoHttp = 401;
  err.codigo = "no_autenticado";
  return err;
}

export async function requiereAutenticacion(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(noAutenticado());
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const rol = await buscarRolPorId(payload.rolId);
    req.usuario = { id: payload.sub, rolId: payload.rolId, rol: rol?.nombre ?? null };
    next();
  } catch {
    next(noAutenticado());
  }
}
