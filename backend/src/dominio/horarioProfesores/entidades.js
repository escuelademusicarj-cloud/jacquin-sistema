import { PROGRAMAS_OFICIALES } from "../academico/entidades.js";

/**
 * Valida una fila del horario semanal de profesores. A propósito NO
 * valida que el programa coincida con el instrumento por defecto del
 * profesor — Sergio pidió explícitamente poder poner a un profesor a
 * dictar un curso distinto al que tiene asignado en su perfil.
 */
export function crearAsignacionHorarioProfesor({ profesorId, programa, diaSemana, horaInicio }) {
  if (!profesorId) throw new Error("Hace falta indicar el profesor.");
  if (!PROGRAMAS_OFICIALES.includes(programa)) {
    throw new Error(`El programa debe ser uno de: ${PROGRAMAS_OFICIALES.join(", ")}.`);
  }
  if (diaSemana == null || diaSemana < 0 || diaSemana > 6) throw new Error("Día de la semana inválido (0 a 6).");
  if (!horaInicio) throw new Error("Hace falta la hora de inicio de la franja.");
  return { profesorId, programa, diaSemana, horaInicio };
}
