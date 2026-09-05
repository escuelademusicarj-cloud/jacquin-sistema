import {
  listarRepertorioDeAlumnos, guardarCancionDeAlumno,
  listarEnsambles, crearEnsamble, editarEnsamble, borrarEnsamble,
  agregarIntegranteEnsamble, quitarIntegranteEnsamble,
} from "../../persistencia/clausura/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerRepertorio() {
  return listarRepertorioDeAlumnos();
}

// Guarda las canciones que vengan en la lista (hasta 3 por alumno, numero
// 1/2/3) de una sola vez — así el frontend hace un solo pedido por
// estudiante en vez de tres. Cualquier número fuera de 1-3 se ignora en
// vez de romper el guardado completo.
export async function editarCancionesDeAlumno(alumnoId, canciones, contextoAuditoria) {
  if (!Array.isArray(canciones)) {
    const err = new Error("Formato inválido: se esperaba una lista de canciones.");
    err.codigoHttp = 400;
    throw err;
  }

  const guardadas = [];
  for (const c of canciones) {
    const numero = Number(c.numero);
    if (!(numero >= 1 && numero <= 3)) continue;
    guardadas.push(await guardarCancionDeAlumno(alumnoId, numero, (c.cancion || "").trim()));
  }

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "clausura",
    entidad: "repertorio_clausura", entidadId: alumnoId, resultado: "exito",
  });

  return guardadas;
}

// ---- Ensambles ----
export async function obtenerEnsambles() {
  return listarEnsambles();
}

export async function crearEnsambleNuevo(datos, contextoAuditoria) {
  const nombre = (datos.nombre || "").trim();
  if (!nombre) {
    const err = new Error("El ensamble necesita un nombre.");
    err.codigoHttp = 400;
    throw err;
  }
  const guardado = await crearEnsamble({ nombre, cancion: (datos.cancion || "").trim(), notas: (datos.notas || "").trim() });

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "clausura",
    entidad: "ensamble", entidadId: guardado.id, resultado: "exito",
  });

  return guardado;
}

export async function editarEnsambleExistente(id, datos, contextoAuditoria) {
  const nombre = (datos.nombre || "").trim();
  if (!nombre) {
    const err = new Error("El ensamble necesita un nombre.");
    err.codigoHttp = 400;
    throw err;
  }
  const actualizado = await editarEnsamble(id, { nombre, cancion: (datos.cancion || "").trim(), notas: (datos.notas || "").trim() });
  if (!actualizado) {
    const err = new Error("Ensamble no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "clausura",
    entidad: "ensamble", entidadId: id, resultado: "exito",
  });

  return actualizado;
}

export async function eliminarEnsambleExistente(id, contextoAuditoria) {
  await borrarEnsamble(id);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "clausura",
    entidad: "ensamble", entidadId: id, resultado: "exito",
  });
}

export async function agregarEstudianteAEnsamble(ensambleId, alumnoId, contextoAuditoria) {
  await agregarIntegranteEnsamble(ensambleId, alumnoId);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "agregar_integrante", modulo: "clausura",
    entidad: "ensamble", entidadId: ensambleId, resultado: "exito",
  });
}

export async function quitarEstudianteDeEnsamble(ensambleId, alumnoId, contextoAuditoria) {
  await quitarIntegranteEnsamble(ensambleId, alumnoId);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "quitar_integrante", modulo: "clausura",
    entidad: "ensamble", entidadId: ensambleId, resultado: "exito",
  });
}
