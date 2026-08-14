import { crearClase, verificarLimiteRecuperaciones } from "../../dominio/horarios/entidades.js";
import {
  insertarClase, vincularAlumnoAClase, buscarCruce, listarClases,
  insertarModificacion, recuperacionesDelMes, listarSalas,
} from "../../persistencia/horarios/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerSalas() {
  return listarSalas();
}

/**
 * Crea una clase evitando cruces de profesor o sala en el mismo
 * día/hora — regla explícita de Sergio ("evitar que se crucen clases
 * o se asignen horarios que el profesor no puede atender").
 */
export async function crearClaseNueva({ clase, alumnosIds = [] }, contextoAuditoria) {
  const datos = crearClase(clase);

  const cruces = await buscarCruce({ profesorId: datos.profesorId, salaId: datos.salaId, diaSemana: datos.diaSemana, horaInicio: datos.horaInicio });
  if (cruces.length > 0) {
    throw new Error("Ese profesor o esa sala ya tienen una clase en ese día y horario.");
  }

  const guardada = await insertarClase(datos);
  for (const alumnoId of alumnosIds) {
    await vincularAlumnoAClase(guardada.id, alumnoId);
  }

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "horarios",
    entidad: "clase", entidadId: guardada.id, resultado: "exito",
  });

  return guardada;
}

/**
 * Filtrado por fila: PROFESOR solo ve sus propias clases, ignorando
 * cualquier profesorId que venga en la query — mismo criterio que en
 * Estudiantes, no es negociable desde el frontend.
 */
export async function obtenerClases(filtros, contexto) {
  if (contexto?.rol === "PROFESOR") {
    return listarClases({ ...filtros, profesorId: contexto.usuarioId });
  }
  return listarClases(filtros);
}

/**
 * Registra cancelación, reprogramación o recuperación de una clase en
 * una fecha puntual. Para "recuperada" aplica el límite de 2 por mes
 * por alumno — regla dura, no configurable desde acá.
 */
export async function registrarModificacion({ claseId, alumnoId, tipo, fechaOriginal, fechaNueva, motivo }, contextoAuditoria) {
  if (tipo === "recuperada") {
    if (!alumnoId) throw new Error("Una recuperación necesita especificar el alumno.");
    const usadas = await recuperacionesDelMes(alumnoId, fechaOriginal);
    verificarLimiteRecuperaciones(usadas);
  }

  const mod = await insertarModificacion({ claseId, alumnoId, tipo, fechaOriginal, fechaNueva, motivo });

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: tipo, modulo: "horarios",
    entidad: "clase_modificacion", entidadId: mod.id, resultado: "exito",
  });

  return mod;
}
