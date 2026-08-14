import { crearAsistencia, necesitaAlerta } from "../../dominio/asistencia/entidades.js";
import { insertarOActualizarAsistencia, asistenciasDeClaseYFecha, asistenciasDeAlumno, faltasRecientes } from "../../persistencia/asistencia/repositorio.js";
import { buscarClasePorId, alumnoEsDelProfesor } from "../../persistencia/horarios/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

function sinAccesoAClase() {
  const err = new Error("Esa clase no te pertenece.");
  err.codigoHttp = 403;
  err.codigo = "sin_permiso";
  return err;
}

/**
 * Filtrado por fila: si quien registra es PROFESOR, la clase tiene que
 * ser suya. No alcanza con el permiso "asistencia:crear" — ese permiso
 * dice que puede tomar asistencia en general, no que puede tomarla en
 * la clase de otro profesor.
 */
async function verificarPropiedadClase(claseId, contexto) {
  if (contexto?.rol !== "PROFESOR") return;
  const clase = await buscarClasePorId(claseId);
  if (!clase || clase.profesor_id !== contexto.usuarioId) throw sinAccesoAClase();
}

export async function registrarAsistencia(datos, contextoAuditoria) {
  await verificarPropiedadClase(datos.claseId, contextoAuditoria);

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
  await verificarPropiedadClase(claseId, contexto);
  return asistenciasDeClaseYFecha(claseId, fecha);
}

export async function obtenerAsistenciaDeAlumno(alumnoId, contexto) {
  if (contexto?.rol === "PROFESOR") {
    const esSuyo = await alumnoEsDelProfesor(alumnoId, contexto.usuarioId);
    if (!esSuyo) throw sinAccesoAClase();
  }
  return asistenciasDeAlumno(alumnoId);
}
