// Dominio: reglas puras del módulo de Avances académicos.
export const PREGUNTAS_EVAL_MENSUAL = [
  "digitacion", "ritmo", "lectura", "postura", "memorizacion", "participacion", "practica", "progreso",
];
export const ESCALA_MENSUAL = ["mala", "regular", "normal", "buena"];
export const INDICADORES_EVALUACION = [
  "tecnica", "ritmo", "coordinacion", "interpretacion", "repertorio", "participacion", "disciplina",
];
export const ESCALA_INDICADOR = ["iniciando", "en_desarrollo", "consolidado"];

export function crearEvaluacionMensual({ alumnoId, mes, respuestas, observaciones }) {
  if (!alumnoId) throw new Error("La evaluación necesita un alumno.");
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) throw new Error("El mes debe tener formato AAAA-MM.");
  if (!respuestas || typeof respuestas !== "object") throw new Error("Faltan las respuestas de la evaluación.");
  for (const clave of PREGUNTAS_EVAL_MENSUAL) {
    if (!ESCALA_MENSUAL.includes(respuestas[clave])) {
      throw new Error(`La respuesta de "${clave}" debe ser una de: ${ESCALA_MENSUAL.join(", ")}.`);
    }
  }
  return { alumnoId, mes, respuestas, observaciones: observaciones ?? null };
}

export function crearEvaluacionIndicadores({ alumnoId, fecha, indicadores, observaciones }) {
  if (!alumnoId) throw new Error("La evaluación necesita un alumno.");
  if (!fecha) throw new Error("La evaluación necesita una fecha.");
  if (!indicadores || typeof indicadores !== "object") throw new Error("Faltan los indicadores de la evaluación.");
  for (const clave of INDICADORES_EVALUACION) {
    if (!ESCALA_INDICADOR.includes(indicadores[clave])) {
      throw new Error(`El indicador "${clave}" debe ser uno de: ${ESCALA_INDICADOR.join(", ")}.`);
    }
  }
  return { alumnoId, fecha, indicadores, observaciones: observaciones ?? null };
}
