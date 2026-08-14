// Dominio: reglas puras de Identidad. Este archivo no importa nada
// de persistencia ni de Express a propósito — las reglas de negocio
// del dominio deben poder probarse y entenderse sin levantar un
// servidor ni una base de datos.

/**
 * Roles iniciales del sistema, según el mapa funcional de la Academia
 * Musical Jacquin. Es un catálogo de arranque (seed), no una lista
 * cerrada en código: se pueden agregar roles nuevos vía datos, sin
 * tocar este archivo.
 */
export const ROLES_INICIALES = ["ADMINISTRADOR", "SECRETARIA", "PROFESOR", "DIRECCION"];

export function crearUsuario({ nombre, email, passwordHash, rolId }) {
  if (!nombre || !nombre.trim()) {
    throw new Error("El usuario necesita un nombre.");
  }
  if (!email || !email.includes("@")) {
    throw new Error("El usuario necesita un email válido.");
  }
  if (!passwordHash) {
    throw new Error("El usuario necesita una contraseña (hasheada).");
  }
  if (!rolId) {
    throw new Error("El usuario necesita un rol asignado.");
  }
  return {
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    rolId,
    activo: true,
  };
}

export function crearRol({ nombre, descripcion }) {
  if (!nombre || !nombre.trim()) {
    throw new Error("El rol necesita un nombre.");
  }
  return { nombre: nombre.trim().toUpperCase(), descripcion: descripcion ?? null };
}

export function crearPermiso({ clave, descripcion }) {
  // La clave sigue la convención "<modulo>:<accion>", ej. "estudiantes:crear".
  // Esta convención es lo que permite que la capa de autorización
  // (Fase 1+) verifique permisos sin acoplarse a un rol específico.
  if (!clave || !/^[a-z_]+:[a-z_]+$/.test(clave)) {
    throw new Error('La clave de permiso debe seguir el formato "modulo:accion" en minúsculas.');
  }
  return { clave, descripcion: descripcion ?? null };
}
