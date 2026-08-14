import { crearAlumno, crearAcudiente, cambiarEstadoAlumno, esMenorDeEdad } from "../../dominio/academico/entidades.js";
import {
  insertarAlumno, insertarAcudiente, vincularAcudiente, acudientesDeAlumno,
  listarAlumnos, buscarAlumnoPorId, actualizarEstadoAlumno, insertarHistorialEstado,
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

export async function obtenerAlumno(id, contexto) {
  const alumno = await buscarAlumnoPorId(id);
  if (!alumno) return null;
  if (contexto?.rol === "PROFESOR" && alumno.profesor_id !== contexto.usuarioId) {
    const err = new Error("No tenés acceso a este estudiante.");
    err.codigoHttp = 403;
    err.codigo = "sin_permiso";
    throw err;
  }
  return { ...alumno, acudientes: await acudientesDeAlumno(id) };
}

/**
 * Filtrado por fila: si quien pregunta es PROFESOR, solo ve sus propios
 * alumnos (profesor_id = su propio id), sin importar qué filtros pida
 * en la query — no es una preferencia, es una regla de seguridad que
 * no depende de lo que el frontend envíe.
 */
export async function obtenerListaAlumnos(filtros, contexto) {
  if (contexto?.rol === "PROFESOR") {
    return listarAlumnos({ ...filtros, profesorId: contexto.usuarioId });
  }
  return listarAlumnos(filtros);
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
