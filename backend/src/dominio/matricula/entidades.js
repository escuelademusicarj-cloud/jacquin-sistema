import { PROGRAMAS_OFICIALES } from "../academico/entidades.js";

export function crearPlan({ programa, horasSemanales, valor }) {
  if (!PROGRAMAS_OFICIALES.includes(programa)) {
    throw new Error(`El programa del plan debe ser uno de: ${PROGRAMAS_OFICIALES.join(", ")}.`);
  }
  if (valor == null || Number(valor) <= 0) throw new Error("El plan necesita un valor mayor a cero.");
  const horas = horasSemanales != null ? Number(horasSemanales) : null;
  // El nombre ya no es un campo libre — se deriva del programa (que
  // sale del catálogo oficial) para no terminar con nombres inventados
  // que no coincidan con el catálogo real de la academia.
  const nombre = horas ? `${programa} — ${horas}h/semana` : programa;
  return { nombre, programa, horasSemanales: horas, valor: Number(valor) };
}

export function crearInscripcion({ alumnoId, planId, fechaInicio }) {
  if (!alumnoId) throw new Error("La inscripción necesita un alumno.");
  if (!planId) throw new Error("La inscripción necesita un plan.");
  if (!fechaInicio) throw new Error("La inscripción necesita una fecha de inicio.");
  return { alumnoId, planId, fechaInicio, estado: "activa" };
}
