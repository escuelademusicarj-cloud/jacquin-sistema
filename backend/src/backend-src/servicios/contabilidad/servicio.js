import { crearIngreso, crearGasto, crearCompra, crearNomina } from "../../dominio/contabilidad/entidades.js";
import * as repo from "../../persistencia/contabilidad/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

function auditar(ctx, accion, entidad, entidadId) {
  return registrarAuditoria({ usuarioId: ctx?.usuarioId ?? null, accion, modulo: "contabilidad", entidad, entidadId, resultado: "exito" });
}

// ---- Ingresos ----
export async function crearIngresoNuevo(datos, ctx) { const d = crearIngreso(datos); const g = await repo.insertarIngreso(d); await auditar(ctx, "crear", "ingreso", g.id); return g; }
export async function obtenerIngresos() { return repo.listarIngresos(); }
export async function editarIngreso(id, datos, ctx) { const d = crearIngreso(datos); const g = await repo.actualizarIngreso(id, d); await auditar(ctx, "editar", "ingreso", id); return g; }
export async function borrarIngreso(id, ctx) { await repo.eliminarIngreso(id); await auditar(ctx, "eliminar", "ingreso", id); return { eliminado: true }; }

// ---- Gastos ----
export async function crearGastoNuevo(datos, ctx) { const d = crearGasto(datos); const g = await repo.insertarGasto(d); await auditar(ctx, "crear", "gasto", g.id); return g; }
export async function obtenerGastos() { return repo.listarGastos(); }
export async function editarGasto(id, datos, ctx) { const d = crearGasto(datos); const g = await repo.actualizarGasto(id, d); await auditar(ctx, "editar", "gasto", id); return g; }
export async function borrarGasto(id, ctx) { await repo.eliminarGasto(id); await auditar(ctx, "eliminar", "gasto", id); return { eliminado: true }; }

// ---- Compras ----
export async function crearCompraNueva(datos, ctx) { const d = crearCompra(datos); const g = await repo.insertarCompra(d); await auditar(ctx, "crear", "compra", g.id); return g; }
export async function obtenerCompras() { return repo.listarCompras(); }
export async function editarCompra(id, datos, ctx) { const d = crearCompra(datos); const g = await repo.actualizarCompra(id, d); await auditar(ctx, "editar", "compra", id); return g; }
export async function borrarCompra(id, ctx) { await repo.eliminarCompra(id); await auditar(ctx, "eliminar", "compra", id); return { eliminado: true }; }

// ---- Nómina ----
export async function crearNominaNueva(datos, ctx) { const d = crearNomina(datos); const g = await repo.insertarNomina(d); await auditar(ctx, "crear", "nomina", g.id); return g; }
export async function obtenerNomina() { return repo.listarNomina(); }
export async function editarNomina(id, datos, ctx) { const d = crearNomina(datos); const g = await repo.actualizarNomina(id, d); await auditar(ctx, "editar", "nomina", id); return g; }
export async function borrarNomina(id, ctx) { await repo.eliminarNomina(id); await auditar(ctx, "eliminar", "nomina", id); return { eliminado: true }; }
