import { listarPermisosModuloPorRol, reemplazarModulosDeRol } from "../../persistencia/permisos/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerPermisosModulo() {
  return listarPermisosModuloPorRol();
}

export async function actualizarPermisosDeRol(rolId, modulos, contextoAuditoria) {
  if (!Array.isArray(modulos)) throw new Error("La lista de módulos debe ser un arreglo.");
  const guardado = await reemplazarModulosDeRol(rolId, modulos);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "permisos",
    entidad: "permisos_modulo_rol", entidadId: rolId, resultado: "exito",
  });
  return guardado;
}
