import { PROGRAMAS_OFICIALES } from "../academico/entidades.js";

export const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const MAX_RECUPERACIONES_POR_MES = 2; // regla explícita confirmada por Sergio — no cambiar sin confirmarlo de nuevo.

export function crearClase({ profesorId, salaId, programa, tipo, diaSemana, horaInicio, duracionMinutos }) {
  if (!profesorId) throw new Error("La clase necesita un profesor.");
  if (!PROGRAMAS_OFICIALES.includes(programa)) {
    throw new Error(`El programa debe ser uno de: ${PROGRAMAS_OFICIALES.join(", ")}.`);
  }
  if (diaSemana == null || diaSemana < 0 || diaSemana > 6) throw new Error("Día de la semana inválido (0 a 6).");
  if (!horaInicio) throw new Error("La clase necesita una hora de inicio.");
  return {
    profesorId, salaId: salaId ?? null, programa,
    tipo: tipo === "grupal" ? "grupal" : "individual",
    diaSemana, horaInicio, duracionMinutos: duracionMinutos ?? 45,
  };
}

/**
 * Verifica el límite de recuperaciones antes de registrar una nueva.
 * Cuenta las ya usadas por el alumno en el mismo mes calendario de la
 * fecha original — no en los últimos 30 días, un mes calendario.
 */
export function verificarLimiteRecuperaciones(recuperacionesDelMes) {
  if (recuperacionesDelMes.length >= MAX_RECUPERACIONES_POR_MES) {
    throw new Error(`El alumno ya usó sus ${MAX_RECUPERACIONES_POR_MES} recuperaciones de este mes.`);
  }
}
