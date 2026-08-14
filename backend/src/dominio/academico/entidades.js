// Dominio: reglas puras del módulo académico. Sin dependencias de
// Express ni de la base de datos, igual que dominio/identidad.

// Catálogo real confirmado por Sergio (cuestionario, 2026-08-12).
// Vive acá como lista de dominio porque el módulo de Cursos y
// Programas todavía no existe como tabla propia — cuando se
// construya, migrar esta validación a una consulta contra esa tabla.
export const PROGRAMAS_OFICIALES = [
  "Piano",
  "Guitarra acústica",
  "Guitarra eléctrica",
  "Bajo",
  "Técnica vocal",
  "Violín",
  "Percusión",
  "Iniciación musical",
  "Exploración musical infantil",
];

export const ESTADOS_ALUMNO = ["activo", "inactivo", "retirado", "preinscrito", "pendiente_matricula"];

export function esMenorDeEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null; // sin fecha, no se puede determinar — el servicio decide qué hacer
  var nacimiento = new Date(fechaNacimiento);
  var hoy = new Date();
  var edad = hoy.getFullYear() - nacimiento.getFullYear();
  var meses = hoy.getMonth() - nacimiento.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad < 18;
}

export function crearAlumno({ nombres, apellidos, documento, fechaNacimiento, telefonoContacto, emailContacto, programaPrincipal, profesorId, observaciones }) {
  if (!nombres || !nombres.trim()) throw new Error("El alumno necesita nombres.");
  if (!apellidos || !apellidos.trim()) throw new Error("El alumno necesita apellidos.");
  if (!programaPrincipal || !PROGRAMAS_OFICIALES.includes(programaPrincipal)) {
    throw new Error(`El programa debe ser uno de: ${PROGRAMAS_OFICIALES.join(", ")}.`);
  }
  return {
    nombres: nombres.trim(),
    apellidos: apellidos.trim(),
    documento: documento ?? null,
    fechaNacimiento: fechaNacimiento ?? null,
    telefonoContacto: telefonoContacto ?? null,
    emailContacto: emailContacto ?? null,
    programaPrincipal,
    profesorId: profesorId ?? null,
    observaciones: observaciones ?? null,
    // Estado inicial: preinscrito, no "activo" — el alumno se activa
    // recién cuando se completa la matrícula (módulo de Matrícula).
    estado: "preinscrito",
  };
}

export function crearAcudiente({ nombre, documento, telefono, email }) {
  if (!nombre || !nombre.trim()) throw new Error("El acudiente necesita un nombre.");
  return { nombre: nombre.trim(), documento: documento ?? null, telefono: telefono ?? null, email: email ?? null };
}

export function cambiarEstadoAlumno(estadoActual, estadoNuevo) {
  if (!ESTADOS_ALUMNO.includes(estadoNuevo)) {
    throw new Error(`Estado inválido. Debe ser uno de: ${ESTADOS_ALUMNO.join(", ")}.`);
  }
  // Regla de Sergio: el historial nunca se pierde — este helper no
  // borra nada, el servicio es responsable de insertar el registro
  // en alumno_historial_estados además de actualizar el estado actual.
  return { estadoAnterior: estadoActual, estadoNuevo };
}
