import { crearEvaluacionMensual, crearEvaluacionIndicadores } from "../../dominio/avances/entidades.js";
import {
  upsertEvaluacionMensual, listarEvaluacionesMensuales, eliminarEvaluacionMensual,
  insertarEvaluacionIndicadores, listarEvaluacionesIndicadores,
} from "../../persistencia/avances/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function guardarEvaluacionMensual(datos, contextoAuditoria) {
  const validado = crearEvaluacionMensual(datos);
  const guardada = await upsertEvaluacionMensual(validado);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "avances",
    entidad: "evaluacion_mensual", entidadId: guardada.id, resultado: "exito",
  });
  return guardada;
}

export async function obtenerEvaluacionesMensuales() {
  return listarEvaluacionesMensuales();
}

export async function borrarEvaluacionMensual(id, contextoAuditoria) {
  await eliminarEvaluacionMensual(id);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "avances",
    entidad: "evaluacion_mensual", entidadId: id, resultado: "exito",
  });
  return { eliminado: true };
}

export async function guardarEvaluacionIndicadores(datos, contextoAuditoria) {
  const validado = crearEvaluacionIndicadores(datos);
  const guardada = await insertarEvaluacionIndicadores(validado);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "avances",
    entidad: "evaluacion_indicadores", entidadId: guardada.id, resultado: "exito",
  });
  return guardada;
}

export async function obtenerEvaluacionesIndicadores(alumnoId) {
  return listarEvaluacionesIndicadores(alumnoId);
}
