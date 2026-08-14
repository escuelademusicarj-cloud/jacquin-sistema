// Servicios: orquesta dominio + persistencia + efectos secundarios
// (auditoría). Es donde vive el caso de uso completo, no solo el
// guardado de datos.
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { crearUsuario } from "../../dominio/identidad/entidades.js";
import { insertarUsuario, buscarUsuarioPorEmail, buscarRolPorNombre, buscarRolPorId, contarUsuarios } from "../../persistencia/identidad/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

const RONDAS_HASH = 10;
const DURACION_TOKEN = "8h";

function credencialesInvalidas() {
  const err = new Error("Email o contraseña incorrectos.");
  err.codigoHttp = 401;
  err.codigo = "credenciales_invalidas";
  return err;
}

/**
 * Login real (Fase 1). Verifica contraseña contra el hash guardado y
 * emite un token firmado — recién acá empieza a existir una sesión.
 */
export async function login({ email, password }) {
  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario || !usuario.activo) {
    throw credencialesInvalidas();
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    await registrarAuditoria({
      usuarioId: usuario.id,
      accion: "login_fallido",
      modulo: "identidad",
      entidad: "usuario",
      entidadId: usuario.id,
      resultado: "error",
    });
    throw credencialesInvalidas();
  }

  const rol = await buscarRolPorId(usuario.rol_id);

  const token = jwt.sign({ sub: usuario.id, rolId: usuario.rol_id }, process.env.JWT_SECRET, {
    expiresIn: DURACION_TOKEN,
  });

  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "login",
    modulo: "identidad",
    entidad: "usuario",
    entidadId: usuario.id,
    resultado: "exito",
  });

  return {
    token,
    // El HTML necesita el NOMBRE del rol (no solo el id) para decidir
    // qué módulos mostrarle a cada usuario.
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rolId: usuario.rol_id, rol: rol?.nombre ?? null },
  };
}

/**
 * Bootstrap de un solo uso: crea el primer usuario ADMINISTRADOR
 * cuando todavía no existe ninguno. Se autodesactiva solo — si ya hay
 * al menos un usuario en la base, rechaza. Pensado para publicar sin
 * necesitar Node.js/terminal local: se dispara visitando la URL una
 * vez desde el navegador.
 */
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

/**
 * Alta de un usuario del sistema (administrador, secretaría, profesor
 * o dirección). No es el flujo de login — eso es Fase 1. Esto es lo
 * mínimo necesario para poder cargar los usuarios semilla.
 */
export async function altaUsuario({ nombre, email, password, rolId }, contextoAuditoria) {
  const existente = await buscarUsuarioPorEmail(email);
  if (existente) {
    throw new Error(`Ya existe un usuario con el email ${email}.`);
  }

  const passwordHash = await bcrypt.hash(password, RONDAS_HASH);
  const usuario = crearUsuario({ nombre, email, passwordHash, rolId });
  const guardado = await insertarUsuario(usuario);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null,
    accion: "crear",
    modulo: "identidad",
    entidad: "usuario",
    entidadId: guardado.id,
    resultado: "exito",
  });

  return guardado;
}
