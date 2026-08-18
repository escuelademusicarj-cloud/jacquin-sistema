import { crearMensaje } from "../../dominio/comunicacion/entidades.js";
import { insertarMensaje, insertarDestinatario, destinatariosDeMensaje, mensajesRecibidosPorUsuario, mensajesEnviadosPorUsuario, marcarLeido } from "../../persistencia/comunicacion/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function enviarMensaje(datos, contextoAuditoria) {
  const validado = crearMensaje({ ...datos, deUsuarioId: contextoAuditoria?.usuarioId });
  const guardado = await insertarMensaje(validado);
  for (const usuarioId of validado.destinatarios) {
    await insertarDestinatario(guardado.id, usuarioId);
  }
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "comunicacion",
    entidad: "mensaje", entidadId: guardado.id, resultado: "exito",
  });
  return { ...guardado, destinatarios: await destinatariosDeMensaje(guardado.id) };
}

export async function obtenerBandeja(usuarioId) {
  return mensajesRecibidosPorUsuario(usuarioId);
}

export async function obtenerEnviados(usuarioId) {
  const enviados = await mensajesEnviadosPorUsuario(usuarioId);
  const conDestinatarios = [];
  for (const m of enviados) conDestinatarios.push({ ...m, destinatarios: await destinatariosDeMensaje(m.id) });
  return conDestinatarios;
}

export async function marcarMensajeLeido(mensajeId, usuarioId) {
  await marcarLeido(mensajeId, usuarioId);
  return { leido: true };
}
