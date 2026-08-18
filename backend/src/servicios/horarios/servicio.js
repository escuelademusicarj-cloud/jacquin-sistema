import { crearClase, verificarLimiteRecuperaciones } from "../../dominio/horarios/entidades.js";
import {
  insertarClase, vincularAlumnoAClase, buscarCruce, listarClases,
  insertarModificacion, recuperacionesDelMes, listarSalas, alumnosDeClase,
} from "../../persistencia/horarios/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerSalas() {
  return listarSalas();
}

/**
 * Crea una clase evitando cruces de profesor o sala en el mismo
 * día/hora. El profesor ya NO es obligatorio (cambio pedido
 * explícitamente) — en cambio, la clase SIEMPRE necesita al menos un
 * estudiante, porque una clase se define por a quién le pertenece, no
 * por quién la dicta.
 */
export async function crearClaseNueva({ clase, alumnosIds = [] }, contextoAuditoria) {
  if (!alumnosIds || alumnosIds.length === 0) {
    throw new Error("La clase necesita al menos un estudiante.");
  }

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

  return { ...guardada, alumnos: await alumnosDeClase(guardada.id) };
}

/**
 * Filtrado por fila: PROFESOR solo ve sus propias clases, ignorando
 * cualquier profesorId que venga en la query — mismo criterio que en
 * Estudiantes, no es negociable desde el frontend.
 */
export async function obtenerClases(filtros, contexto) {
  let clases;
  if (contexto?.rol === "PROFESOR") {
    clases = await listarClases({ ...filtros, profesorId: contexto.usuarioId });
  } else {
    clases = await listarClases(filtros);
  }
  // Cada clase incluye ya sus alumnos — antes esta relación no se podía
  // releer (solo escribir al crear), por eso la grilla se quedaba sin
  // mostrar a nadie.
  const conAlumnos = [];
  for (const c of clases) {
    conAlumnos.push({ ...c, alumnos: await alumnosDeClase(c.id) });
  }
  return conAlumnos;
}

/** Trae los alumnos de una clase puntual — usado también solo, sin traer todas las clases. */
export async function obtenerAlumnosDeClase(claseId) {
  return alumnosDeClase(claseId);
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
