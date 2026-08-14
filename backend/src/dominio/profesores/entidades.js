import { PROGRAMAS_OFICIALES } from "../academico/entidades.js";

export function crearPerfilProfesor({ usuarioId, telefono, instrumentos, experiencia }) {
  if (!usuarioId) throw new Error("El perfil necesita un usuario asociado.");
  if (instrumentos && instrumentos.length > 0) {
    const invalidos = instrumentos.filter((i) => !PROGRAMAS_OFICIALES.includes(i));
    if (invalidos.length > 0) throw new Error(`Instrumentos no reconocidos: ${invalidos.join(", ")}.`);
  }
  return { usuarioId, telefono: telefono ?? null, instrumentos: (instrumentos ?? []).join(", "), experiencia: experiencia ?? null };
}

export function crearDisponibilidad({ usuarioId, diaSemana, horaInicio, horaFin }) {
  if (!usuarioId) throw new Error("La disponibilidad necesita un profesor.");
  if (diaSemana == null || diaSemana < 0 || diaSemana > 6) throw new Error("Día de la semana inválido (0 a 6).");
  if (!horaInicio || !horaFin) throw new Error("La disponibilidad necesita hora de inicio y fin.");
  if (horaFin <= horaInicio) throw new Error("La hora de fin debe ser posterior a la de inicio.");
  return { usuarioId, diaSemana, horaInicio, horaFin };
}
