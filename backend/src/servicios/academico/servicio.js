import { crearAlumno, crearAcudiente, cambiarEstadoAlumno, esMenorDeEdad } from "../../dominio/academico/entidades.js";
import {
  insertarAlumno, insertarAcudiente, vincularAcudiente, acudientesDeAlumno,
  listarAlumnos, buscarAlumnoPorId, actualizarAlumno, actualizarEstadoAlumno, insertarHistorialEstado,
} from "../../persistencia/academico/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

/**
 * Alta de alumno, opcionalmente con uno o más acudientes en la misma
 * operación — así cubre el caso real del flujo de matrícula que
 * describió Sergio (se recopilan datos de estudiante y acudiente juntos).
 *
 * Regla de negocio: si el alumno es menor de 18 años, el alta exige
 * al menos un acudiente — no queda como "opcional" en ese caso.
 */
export async function altaAlumno({ alumno, acudientes = [] }, contextoAuditoria) {
  const datosAlumno = crearAlumno(alumno);

  const menor = esMenorDeEdad(datosAlumno.fechaNacimiento);
  if (menor === null) {
    throw new Error("La fecha de nacimiento es obligatoria para determinar si el alumno es menor de edad.");
  }
  if (menor && acudientes.length === 0) {
    throw new Error("El alumno es menor de edad: se necesita al menos un acudiente para registrarlo.");
  }

  const guardado = await insertarAlumno(datosAlumno);

  for (const a of acudientes) {
    const datosAcudiente = crearAcudiente(a);
    const acudienteGuardado = await insertarAcudiente(datosAcudiente);
    await vincularAcudiente({ alumnoId: guardado.id, acudienteId: acudienteGuardado.id, relacion: a.relacion });
  }

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null,
    accion: "crear",
    modulo: "academico",
    entidad: "alumno",
    entidadId: guardado.id,
    resultado: "exito",
  });

  return { ...guardado, acudientes: await acudientesDeAlumno(guardado.id) };
}

// Decisión de negocio (2026-08-28): Profesor ve el mismo historial
// completo que Administración — ya no se restringe por profesor_id.
export async function obtenerAlumno(id, contexto) {
  const alumno = await buscarAlumnoPorId(id);
  if (!alumno) return null;
  return { ...alumno, acudientes: await acudientesDeAlumno(id) };
}

/**
 * Decisión de negocio (2026-08-28): Profesor ve la misma lista completa
 * de estudiantes que Administración — ya no se recorta por profesor_id.
 */
export async function obtenerListaAlumnos(filtros, contexto) {
  return listarAlumnos(filtros);
}

// NUEVO: edita los datos propios de un alumno ya existente (nombres,
// apellidos, documento, fecha de nacimiento, contacto, programa,
// profesor asignado, observaciones) — no su estado, eso sigue siendo
// cambiarEstado() más abajo, con su propio historial aparte.
export async function editarAlumno(id, datos, contextoAuditoria) {
  const existente = await buscarAlumnoPorId(id);
  if (!existente) {
    const err = new Error("Alumno no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }

  const actualizado = await actualizarAlumno(id, {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    documento: datos.documento ?? null,
    fechaNacimiento: datos.fechaNacimiento ?? null,
    telefonoContacto: datos.telefonoContacto ?? null,
    emailContacto: datos.emailContacto ?? null,
    programaPrincipal: datos.programaPrincipal ?? null,
    profesorId: datos.profesorId ?? null,
    observaciones: datos.observaciones ?? null,
  });

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "academico",
    entidad: "alumno", entidadId: id, resultado: "exito",
  });

  return { ...actualizado, acudientes: await acudientesDeAlumno(id) };
}

/**
 * Cambia el estado del alumno y SIEMPRE deja registro en el historial
 * — regla explícita de Sergio: el historial nunca se pierde.
 */
export async function cambiarEstado({ alumnoId, estadoNuevo, motivo }, contextoAuditoria) {
  const alumno = await buscarAlumnoPorId(alumnoId);
  if (!alumno) throw new Error("Alumno no encontrado.");

  const { estadoAnterior } = cambiarEstadoAlumno(alumno.estado, estadoNuevo);
  const actualizado = await actualizarEstadoAlumno(alumnoId, estadoNuevo);
  await insertarHistorialEstado({ alumnoId, estadoAnterior, estadoNuevo, motivo });

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null,
    accion: "cambiar_estado",
    modulo: "academico",
    entidad: "alumno",
    entidadId: alumnoId,
    resultado: "exito",
  });

  return actualizado;
}
