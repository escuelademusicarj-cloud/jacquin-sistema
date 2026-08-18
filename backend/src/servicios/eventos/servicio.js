import { crearEvento, validarNuevoEstado, crearInvitado } from "../../dominio/eventos/entidades.js";
import {
  insertarEvento, listarEventos, buscarEventoPorId, actualizarEvento, actualizarEstadoEvento,
  eliminarEvento, insertarInvitado, invitadosDeEvento, actualizarInvitado,
} from "../../persistencia/eventos/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

/**
 * Crea el evento y, en la misma operación, a todos sus invitados
 * (estudiantes y profesores) — igual que Estudiantes crea alumno +
 * acudientes juntos.
 */
export async function crearEventoNuevo({ evento, invitados = [] }, contextoAuditoria) {
  const datos = crearEvento(evento);
  const guardado = await insertarEvento(datos);

  for (const inv of invitados) {
    const datosInv = crearInvitado({ eventoId: guardado.id, tipo: inv.tipo, alumnoId: inv.alumnoId, usuarioId: inv.usuarioId });
    await insertarInvitado(datosInv);
  }

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "eventos",
    entidad: "evento", entidadId: guardado.id, resultado: "exito",
  });

  return { ...guardado, invitados: await invitadosDeEvento(guardado.id) };
}

export async function obtenerEventos() {
  const eventos = await listarEventos();
  const conInvitados = [];
  for (const e of eventos) {
    conInvitados.push({ ...e, invitados: await invitadosDeEvento(e.id) });
  }
  return conInvitados;
}

export async function obtenerEvento(id) {
  const evento = await buscarEventoPorId(id);
  if (!evento) return null;
  return { ...evento, invitados: await invitadosDeEvento(id) };
}

export async function editarEvento(id, datosEvento, contextoAuditoria) {
  const datos = crearEvento(datosEvento);
  const actualizado = await actualizarEvento(id, datos);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "eventos",
    entidad: "evento", entidadId: id, resultado: "exito",
  });
  return actualizado;
}

export async function cambiarEstado(id, estadoNuevo, contextoAuditoria) {
  const validado = validarNuevoEstado(estadoNuevo);
  const actualizado = await actualizarEstadoEvento(id, validado);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "cambiar_estado", modulo: "eventos",
    entidad: "evento", entidadId: id, resultado: "exito",
  });
  return actualizado;
}

export async function borrarEvento(id, contextoAuditoria) {
  await eliminarEvento(id);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "eventos",
    entidad: "evento", entidadId: id, resultado: "exito",
  });
  return { eliminado: true };
}

export async function marcarInvitacionEnviada(invitadoId) {
  return actualizarInvitado(invitadoId, {
    invitacion_enviada: true,
    fecha_envio: new Date().toISOString().slice(0, 10),
  });
}

export async function marcarConfirmado(invitadoId, confirmado) {
  return actualizarInvitado(invitadoId, { confirmado: !!confirmado });
}
