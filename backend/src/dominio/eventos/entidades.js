// Dominio: reglas puras del módulo de Eventos. Sin dependencias de
// Express ni de la base de datos, mismo criterio que dominio/academico.

export const TIPOS_EVENTO = ["Ensayo", "Presentación", "Otro"];
export const ESTADOS_EVENTO = ["programado", "realizado", "cancelado"];

export function crearEvento({ tipo, titulo, fecha, hora, lugar, notas, profesorResponsableId }) {
  if (!TIPOS_EVENTO.includes(tipo)) {
    throw new Error(`El tipo de evento debe ser uno de: ${TIPOS_EVENTO.join(", ")}.`);
  }
  if (!titulo || !titulo.trim()) throw new Error("El evento necesita un título.");
  if (!fecha) throw new Error("El evento necesita una fecha.");
  return {
    tipo,
    titulo: titulo.trim(),
    fecha,
    hora: hora ?? null,
    lugar: lugar ?? null,
    notas: notas ?? null,
    profesorResponsableId: profesorResponsableId ?? null,
    // Estado inicial siempre "programado" — igual que Estudiantes con
    // "preinscrito", no queda a criterio de lo que mande el frontend.
    estado: "programado",
  };
}

export function validarNuevoEstado(estadoNuevo) {
  if (!ESTADOS_EVENTO.includes(estadoNuevo)) {
    throw new Error(`Estado inválido. Debe ser uno de: ${ESTADOS_EVENTO.join(", ")}.`);
  }
  return estadoNuevo;
}

export function crearInvitado({ eventoId, tipo, alumnoId, usuarioId }) {
  if (!eventoId) throw new Error("El invitado necesita un evento.");
  if (tipo !== "estudiante" && tipo !== "profesor") {
    throw new Error('El tipo de invitado debe ser "estudiante" o "profesor".');
  }
  if (tipo === "estudiante" && !alumnoId) throw new Error("Falta el alumno del invitado.");
  if (tipo === "profesor" && !usuarioId) throw new Error("Falta el profesor del invitado.");
  return {
    eventoId,
    tipo,
    alumnoId: alumnoId ?? null,
    usuarioId: usuarioId ?? null,
    invitacionEnviada: false,
    fechaEnvio: null,
    confirmado: false,
  };
}
