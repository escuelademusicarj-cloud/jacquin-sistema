import { listarRepertorioDeAlumnos, guardarCancionDeAlumno } from "../../persistencia/clausura/repositorio.js";
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
