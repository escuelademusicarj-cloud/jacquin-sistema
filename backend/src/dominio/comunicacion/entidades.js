export function crearMensaje({ deUsuarioId, paraTodos, destinatarios, asunto, cuerpo, prioridad }) {
  if (!deUsuarioId) throw new Error("El mensaje necesita un remitente.");
  if (!asunto || !asunto.trim()) throw new Error("El mensaje necesita un asunto.");
  if (!cuerpo || !cuerpo.trim()) throw new Error("El mensaje necesita un cuerpo.");
  if (!paraTodos && (!destinatarios || destinatarios.length === 0)) {
    throw new Error("El mensaje necesita al menos un destinatario, o marcarse para todo el personal.");
  }
  return {
    deUsuarioId, paraTodos: !!paraTodos, destinatarios: paraTodos ? [] : destinatarios,
    asunto: asunto.trim(), cuerpo: cuerpo.trim(), prioridad: prioridad === "urgente" ? "urgente" : "normal",
  };
}
