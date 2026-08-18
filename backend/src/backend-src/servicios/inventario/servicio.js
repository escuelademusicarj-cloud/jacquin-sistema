import { crearItemInventario } from "../../dominio/inventario/entidades.js";
import { insertarItem, listarItems, actualizarItem, eliminarItem } from "../../persistencia/inventario/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function crearItemNuevo(datos, ctx) {
  const d = crearItemInventario(datos);
  const g = await insertarItem(d);
  await registrarAuditoria({ usuarioId: ctx?.usuarioId ?? null, accion: "crear", modulo: "inventario", entidad: "item", entidadId: g.id, resultado: "exito" });
  return g;
}
export async function obtenerItems() { return listarItems(); }
export async function editarItem(id, datos, ctx) {
  const d = crearItemInventario(datos);
  const g = await actualizarItem(id, d);
  await registrarAuditoria({ usuarioId: ctx?.usuarioId ?? null, accion: "editar", modulo: "inventario", entidad: "item", entidadId: id, resultado: "exito" });
  return g;
}
export async function borrarItem(id, ctx) {
  await eliminarItem(id);
  await registrarAuditoria({ usuarioId: ctx?.usuarioId ?? null, accion: "eliminar", modulo: "inventario", entidad: "item", entidadId: id, resultado: "exito" });
  return { eliminado: true };
}
