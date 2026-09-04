// Servicios: orquesta dominio + persistencia + efectos secundarios
// (auditoría). Es donde vive el caso de uso completo, no solo el
// guardado de datos.
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { crearUsuario } from "../../dominio/identidad/entidades.js";
import {
  insertarUsuario, buscarUsuarioPorEmail, buscarRolPorNombre, buscarRolPorId, contarUsuarios,
  listarUsuarios, buscarUsuarioPorId, buscarUsuarioPorIdConHash, actualizarUsuario, actualizarPasswordUsuario, eliminarUsuario,
} from "../../persistencia/identidad/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";
import { enviarCorreoBienvenida } from "../notificaciones/servicio.js";

const RONDAS_HASH = 10;
const DURACION_TOKEN = "8h";

function credencialesInvalidas() {
  const err = new Error("Email o contraseña incorrectos.");
  err.codigoHttp = 401;
  err.codigo = "credenciales_invalidas";
  return err;
}

export async function login({ email, password }) {
  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario || !usuario.activo) {
    throw credencialesInvalidas();
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    await registrarAuditoria({
      usuarioId: usuario.id, accion: "login_fallido", modulo: "identidad",
      entidad: "usuario", entidadId: usuario.id, resultado: "error",
    });
    throw credencialesInvalidas();
  }

  const rol = await buscarRolPorId(usuario.rol_id);
  const token = jwt.sign({ sub: usuario.id, rolId: usuario.rol_id }, process.env.JWT_SECRET, { expiresIn: DURACION_TOKEN });

  await registrarAuditoria({
    usuarioId: usuario.id, accion: "login", modulo: "identidad",
    entidad: "usuario", entidadId: usuario.id, resultado: "exito",
  });

  return {
    token,
    usuario: {
      id: usuario.id, nombre: usuario.nombre, email: usuario.email, rolId: usuario.rol_id, rol: rol?.nombre ?? null,
      debeCambiarPassword: usuario.debe_cambiar_password,
    },
  };
}

export async function bootstrapAdmin() {
  const totalUsuarios = await contarUsuarios();
  if (totalUsuarios > 0) {
    const err = new Error("Ya existe al menos un usuario — el bootstrap ya se usó y no se puede repetir.");
    err.codigoHttp = 409;
    err.codigo = "bootstrap_ya_usado";
    throw err;
  }

  const rolAdmin = await buscarRolPorNombre("ADMINISTRADOR");
  if (!rolAdmin) {
    throw new Error("No existe el rol ADMINISTRADOR — verificá que la migración se haya corrido en Supabase.");
  }

  const email = process.env.ADMIN_SEED_EMAIL || "admin@jacquin.local";
  const password = process.env.ADMIN_SEED_PASSWORD || "CambiarEnPrimerIngreso123";
  const passwordHash = await bcrypt.hash(password, RONDAS_HASH);
  const usuario = crearUsuario({ nombre: "Administrador", email, passwordHash, rolId: rolAdmin.id });
  const guardado = await insertarUsuario(usuario);

  await registrarAuditoria({
    usuarioId: null, accion: "bootstrap", modulo: "identidad",
    entidad: "usuario", entidadId: guardado.id, resultado: "exito",
  });

  return { email, mensaje: "Admin creado. Usá el email de arriba con la contraseña que hayas definido en ADMIN_SEED_PASSWORD (o la de por defecto si no la cambiaste)." };
}

// Si el email pertenece a un usuario ACTIVO, se bloquea (ya existe de
// verdad). Si pertenece a uno DESACTIVADO (ver eliminarUsuario — es un
// borrado lógico, no físico), se reactiva esa misma fila con los datos
// nuevos en vez de bloquear o intentar un INSERT duplicado — la columna
// email tiene una restricción UNIQUE real en la tabla, así que un INSERT
// nuevo fallaría igual aunque el chequeo de acá lo dejara pasar.
//
// debe_cambiar_password queda en true (la contraseña que se le puso es
// temporal) para TODOS los roles, EXCEPTO Invitado (decisión de negocio
// 2026-09-04): a esa gente externa que solo entra a jugar al Amigo
// Secreto no le pedimos ese paso extra, para que el ingreso sea directo.
// En los dos casos (alta nueva o reactivación) se le manda igual el
// correo de bienvenida con esos datos. Si el correo falla, el alta del
// usuario NO se deshace (ya quedó guardada en la base de datos); se
// devuelve correoEnviado:false para que quien creó al usuario sepa que
// tiene que avisarle los datos por otro medio.
export async function altaUsuario({ nombre, email, password, rolId }, contextoAuditoria) {
  const existente = await buscarUsuarioPorEmail(email);
  if (existente && existente.activo) {
    throw new Error(`Ya existe un usuario con el email ${email}.`);
  }

  const rol = await buscarRolPorId(rolId);
  const esInvitado = rol?.nombre === "INVITADO";

  const passwordHash = await bcrypt.hash(password, RONDAS_HASH);
  let guardado;

  if (existente) {
    const reactivado = await actualizarUsuario(existente.id, { nombre, email, rolId, activo: true });
    await actualizarPasswordUsuario(existente.id, passwordHash, !esInvitado);
    await registrarAuditoria({
      usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "reactivar", modulo: "identidad",
      entidad: "usuario", entidadId: reactivado.id, resultado: "exito",
    });
    guardado = { ...reactivado, debe_cambiar_password: !esInvitado };
  } else {
    const usuario = crearUsuario({ nombre, email, passwordHash, rolId });
    guardado = await insertarUsuario({ ...usuario, debeCambiarPassword: !esInvitado });
    await registrarAuditoria({
      usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "identidad",
      entidad: "usuario", entidadId: guardado.id, resultado: "exito",
    });
  }

  const correo = await enviarCorreoBienvenida({ nombre, email, passwordTemporal: password });
  return { ...guardado, correoEnviado: correo.enviado };
}

// Lista completa — antes no existía ninguna forma de traerla.
export async function obtenerUsuarios() {
  return listarUsuarios();
}

// Edita nombre/email/rol (y opcionalmente activo). Si viene "password" en
// el body (un Administrador resetea la contraseña de otro usuario), la
// cambia Y fuerza a que la tenga que volver a cambiar en su próximo login
// (esa contraseña puesta por otra persona es, por definición, temporal).
export async function editarUsuario(id, { nombre, email, rolId, activo, password }, contextoAuditoria) {
  const actualizado = await actualizarUsuario(id, { nombre, email, rolId, activo });
  if (!actualizado) {
    const err = new Error("Usuario no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }
  if (password) {
    const passwordHash = await bcrypt.hash(password, RONDAS_HASH);
    await actualizarPasswordUsuario(id, passwordHash, true);
  }
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "identidad",
    entidad: "usuario", entidadId: id, resultado: "exito",
  });
  return actualizado;
}

// Elimina (desactiva) un usuario. No deja borrarse a sí mismo (evita que
// un Administrador se quede afuera del sistema sin querer).
export async function borrarUsuario(id, contextoAuditoria) {
  if (contextoAuditoria?.usuarioId && Number(contextoAuditoria.usuarioId) === Number(id)) {
    const err = new Error("No podés eliminar tu propio usuario mientras tenés la sesión abierta.");
    err.codigoHttp = 400;
    throw err;
  }
  await eliminarUsuario(id);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "identidad",
    entidad: "usuario", entidadId: id, resultado: "exito",
  });
  return { eliminado: true };
}

// NUEVO: un usuario cambia su propia contraseña (ej. tras el primer
// ingreso con contraseña temporal). Valida la actual antes de aceptar la
// nueva — no alcanza con estar logueado, tiene que demostrar que la sabe.
export async function cambiarMiPassword({ usuarioId, passwordActual, passwordNueva }) {
  const usuario = await buscarUsuarioPorIdConHash(usuarioId);
  if (!usuario) {
    const err = new Error("Usuario no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }
  const coincide = await bcrypt.compare(passwordActual || "", usuario.password_hash);
  if (!coincide) {
    const err = new Error("La contraseña actual no es correcta.");
    err.codigoHttp = 401;
    err.codigo = "credenciales_invalidas";
    throw err;
  }
  if (!passwordNueva || passwordNueva.length < 8) {
    throw new Error("La contraseña nueva debe tener al menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(passwordNueva, RONDAS_HASH);
  await actualizarPasswordUsuario(usuarioId, passwordHash, false);

  await registrarAuditoria({
    usuarioId, accion: "cambiar_password_propia", modulo: "identidad",
    entidad: "usuario", entidadId: usuarioId, resultado: "exito",
  });

  return { actualizado: true };
}
