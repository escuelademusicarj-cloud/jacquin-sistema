export const ESTADOS_ASISTENCIA = ["asistio", "falta", "excusa", "cancelada", "reprogramada", "recuperada"];

export function crearAsistencia({ claseId, alumnoId, fecha, estado, observaciones, registradoPor }) {
  if (!claseId) throw new Error("La asistencia necesita una clase.");
  if (!alumnoId) throw new Error("La asistencia necesita un alumno.");
  if (!fecha) throw new Error("La asistencia necesita una fecha.");
  if (!ESTADOS_ASISTENCIA.includes(estado)) {
    throw new Error(`Estado inválido. Debe ser uno de: ${ESTADOS_ASISTENCIA.join(", ")}.`);
  }
  return { claseId, alumnoId, fecha, estado, observaciones: observaciones ?? null, registradoPor: registradoPor ?? null };
}

/**
 * Umbral de alerta por inasistencias repetidas — Sergio pidió la
 * alerta pero no dio un número. Queda configurable acá, no hardcodeado
 * como si fuera una certeza; ajustar cuando se confirme con la academia.
 */
export const UMBRAL_ALERTA_FALTAS = 3;

export function necesitaAlerta(faltasRecientes) {
  return faltasRecientes.length >= UMBRAL_ALERTA_FALTAS;
}
