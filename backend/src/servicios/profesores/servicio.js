import { crearPerfilProfesor, crearDisponibilidad } from "../../dominio/profesores/entidades.js";
import { upsertPerfil, listarProfesores, insertarDisponibilidad, disponibilidadDeProfesor } from "../../persistencia/profesores/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

function sinAcceso() {
  const err = new Error("Solo podés editar tu propio perfil de profesor.");
  err.codigoHttp = 403;
  err.codigo = "sin_permiso";
  return err;
}

export async function actualizarPerfil({ usuarioId, telefono, instrumentos, experiencia }, contexto) {
  // Filtrado por fila: un PROFESOR solo puede tocar su propio perfil,
  // aunque tenga el permiso general "profesores:crear".
  if (contexto?.rol === "PROFESOR" && contexto.usuarioId !== Number(usuarioId)) throw sinAcceso();

  const datos = crearPerfilProfesor({ usuarioId, telefono, instrumentos, experiencia });
  const guardado = await upsertPerfil(datos);
  await registrarAuditoria({
    usuarioId: contexto?.usuarioId ?? null, accion: "actualizar", modulo: "profesores",
    entidad: "perfil_profesor", entidadId: usuarioId, resultado: "exito",
  });
  return guardado;
}

export async function obtenerProfesores() {
  return listarProfesores();
}

export async function agregarDisponibilidad({ usuarioId, diaSemana, horaInicio, horaFin }, contexto) {
  if (contexto?.rol === "PROFESOR" && contexto.usuarioId !== Number(usuarioId)) throw sinAcceso();
  const datos = crearDisponibilidad({ usuarioId, diaSemana, horaInicio, horaFin });
  return insertarDisponibilidad(datos);
}

export async function obtenerDisponibilidad(usuarioId) {
  return disponibilidadDeProfesor(usuarioId);
}
