import { crearAsistencia, necesitaAlerta } from "../../dominio/asistencia/entidades.js";
import { insertarOActualizarAsistencia, asistenciasDeClaseYFecha, asistenciasDeAlumno, faltasRecientes } from "../../persistencia/asistencia/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

/**
 * Decisión de negocio (2026-08-28): cualquier Profesor puede registrar y
 * consultar asistencia de cualquier clase o estudiante, igual que
 * Administración — ya no se restringe a "solo mis propias clases".
 * Antes: verificarPropiedadClase() exigía que clase.profesor_id coincidiera
 * con el usuario logueado (si no, 403 "Esa clase no te pertenece."), y
 * obtenerAsistenciaDeAlumno() hacía lo mismo vía alumnoEsDelProfesor().
 * Ambos chequeos se sacaron.
 */
export async function registrarAsistencia(datos, contextoAuditoria) {
  const validado = crearAsistencia({ ...datos, registradoPor: contextoAuditoria?.usuarioId });
  const guardada = await insertarOActualizarAsistencia(validado);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "registrar", modulo: "asistencia",
    entidad: "asistencia", entidadId: guardada.id, resultado: "exito",
  });

  // Alerta por ausencias repetidas — Sergio la pidió explícitamente.
  // No se envía ninguna notificación real todavía (eso es el módulo
  // de Comunicación, Fase 2) — se devuelve la señal para que la capa
  // de presentación decida qué hacer con ella.
  let alerta = false;
  if (validado.estado === "falta") {
    const recientes = await faltasRecientes(validado.alumnoId);
    alerta = necesitaAlerta(recientes);
  }

  return { asistencia: guardada, alerta };
}

export async function obtenerAsistenciaDeClase(claseId, fecha, contexto) {
  return asistenciasDeClaseYFecha(claseId, fecha);
}

export async function obtenerAsistenciaDeAlumno(alumnoId, contexto) {
  return asistenciasDeAlumno(alumnoId);
}
