// Autorización (Fase 1 — ya funcional). Verifica el permiso del rol
// del usuario autenticado contra la clave que declara cada ruta.
import { permisosDeRol } from "../../persistencia/identidad/repositorio.js";

function sinPermiso() {
  const err = new Error("No tenés permiso para hacer esto.");
  err.codigoHttp = 403;
  err.codigo = "sin_permiso";
  return err;
}

export function requierePermiso(claveDelPermiso) {
  return async function (req, res, next) {
    try {
      const permisos = await permisosDeRol(req.usuario.rolId);
      if (!permisos.includes(claveDelPermiso)) {
        return next(sinPermiso());
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
