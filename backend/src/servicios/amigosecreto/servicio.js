import {
  obtenerEventoActivo, crearOActualizarEvento, marcarRevelado, listarParticipantes,
  agregarParticipante as agregarParticipanteRepo, quitarParticipante as quitarParticipanteRepo,
  borrarCrucesDeEvento, guardarCruces, crucesDeEvento, miResultado, guardarDeseos, deseosDeUsuario,
} from "../../persistencia/amigosecreto/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerEventoParaMostrar() {
  return obtenerEventoActivo();
}

export async function configurarEvento({ nombre, fechaEvento, presupuestoSugerido, fechaLimiteDeseos }, contextoAuditoria) {
  const evento = await crearOActualizarEvento({
    nombre: nombre || 'Amigo secreto',
    fechaEvento: fechaEvento || null,
    presupuestoSugerido: presupuestoSugerido || null,
    fechaLimiteDeseos: fechaLimiteDeseos || null,
  });
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "amigosecreto",
    entidad: "evento", entidadId: evento.id, resultado: "exito",
  });
  return evento;
}

async function eventoActivoObligatorio() {
  const evento = await obtenerEventoActivo();
  if (!evento) {
    const err = new Error("Todavía no hay un evento de Amigo Secreto configurado.");
    err.codigoHttp = 400;
    throw err;
  }
  return evento;
}

export async function listarParticipantesDelEvento() {
  const evento = await obtenerEventoActivo();
  if (!evento) return [];
  return listarParticipantes(evento.id);
}

export async function agregarParticipante(usuarioId, contextoAuditoria) {
  const evento = await eventoActivoObligatorio();
  const agregado = await agregarParticipanteRepo(evento.id, usuarioId);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "amigosecreto",
    entidad: "participante", entidadId: usuarioId, resultado: "exito",
  });
  return agregado;
}

export async function quitarParticipante(usuarioId, contextoAuditoria) {
  const evento = await eventoActivoObligatorio();
  await quitarParticipanteRepo(evento.id, usuarioId);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "amigosecreto",
    entidad: "participante", entidadId: usuarioId, resultado: "exito",
  });
  return { eliminado: true };
}

// Sorteo al azar sin exclusiones — "derangement": a nadie le puede tocar
// dar su propio regalo. Ojo: correr el sorteo NO hace que se muestre a
// nadie todavía — para eso está revelarResultados() más abajo, aparte.
function generarDerangement(ids) {
  for (let intento = 0; intento < 200; intento++) {
    const barajado = ids.slice();
    for (let i = barajado.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = barajado[i]; barajado[i] = barajado[j]; barajado[j] = tmp;
    }
    let valido = true;
    for (let k = 0; k < ids.length; k++) {
      if (barajado[k] === ids[k]) { valido = false; break; }
    }
    if (valido) return barajado;
  }
  throw new Error("No se pudo armar el sorteo — probá de nuevo.");
}

export async function realizarSorteo(contextoAuditoria) {
  const evento = await eventoActivoObligatorio();
  const participantes = await listarParticipantes(evento.id);
  if (participantes.length < 2) {
    throw new Error("Hace falta al menos 2 participantes para hacer el sorteo.");
  }

  const ids = participantes.map((p) => p.usuario_id);
  const derangement = generarDerangement(ids);

  await borrarCrucesDeEvento(evento.id);
  const cruces = ids.map((usuarioId, i) => ({ usuarioId, leTocaUsuarioId: derangement[i] }));
  await guardarCruces(evento.id, cruces);
  // Un sorteo nuevo vuelve a ocultar los resultados — si se estaba
  // reemplazando un sorteo ya revelado, hay que revelarlo de nuevo a
  // propósito.
  await marcarRevelado(evento.id, false);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "amigosecreto",
    entidad: "sorteo", entidadId: evento.id, resultado: "exito",
  });

  return { ok: true, totalParticipantes: ids.length };
}

/**
 * Revela (o vuelve a ocultar) los resultados del sorteo activo a todos
 * los participantes de una — separado de hacer el sorteo en sí, para
 * poder armar los cruces con anticipación y decidir después el momento
 * exacto en que cada uno empieza a ver quién le tocó.
 */
export async function revelarResultados(revelado, contextoAuditoria) {
  const evento = await eventoActivoObligatorio();
  const actualizado = await marcarRevelado(evento.id, !!revelado);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "amigosecreto",
    entidad: "revelado", entidadId: evento.id, resultado: "exito",
  });
  return actualizado;
}

export async function obtenerMiResultado(usuarioId) {
  const evento = await obtenerEventoActivo();
  if (!evento) return { evento: null, resultado: null, deseos: '', revelado: false };
  if (!evento.revelado) return { evento, resultado: null, deseos: '', revelado: false };

  const resultado = await miResultado(evento.id, usuarioId);
  const deseosDeEsaPersona = resultado ? await deseosDeUsuario(evento.id, resultado.le_toca_usuario_id) : '';
  return { evento, resultado, deseos: deseosDeEsaPersona, revelado: true };
}

export async function obtenerTodosLosCruces() {
  const evento = await obtenerEventoActivo();
  if (!evento) return [];
  return crucesDeEvento(evento.id);
}

export async function obtenerMisDeseos(usuarioId) {
  const evento = await obtenerEventoActivo();
  if (!evento) return '';
  return deseosDeUsuario(evento.id, usuarioId);
}

export async function guardarMisDeseos(usuarioId, texto) {
  const evento = await eventoActivoObligatorio();
  const guardado = await guardarDeseos(evento.id, usuarioId, texto || '');
  return guardado;
}
