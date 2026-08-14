import { crearPlan, crearInscripcion } from "../../dominio/matricula/entidades.js";
import {
  insertarPlan, listarPlanes, buscarPlanPorId,
  insertarInscripcion, insertarEventoInscripcion, inscripcionesDeAlumno,
} from "../../persistencia/matricula/repositorio.js";
import { buscarRolPorId } from "../../persistencia/identidad/repositorio.js";
import { cambiarEstado } from "../academico/servicio.js";
import { generarCargo, registrarPago, obtenerConceptoPorNombre } from "../pagos/servicio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

/**
 * Definir planes/tarifas queda restringido a ADMINISTRADOR, aunque
 * Secretaría tenga el permiso general "matricula:crear" para inscribir
 * alumnos — es una regla más fina que un permiso binario, por eso se
 * verifica acá y no solo en el middleware de autorización.
 */
export async function crearPlanNuevo(datosPlan, contextoAuditoria) {
  const rol = await buscarRolPorId(contextoAuditoria?.rolId);
  if (!rol || rol.nombre !== "ADMINISTRADOR") {
    const err = new Error("Solo Administración puede crear o editar planes y tarifas.");
    err.codigoHttp = 403;
    err.codigo = "sin_permiso";
    throw err;
  }
  const datos = crearPlan(datosPlan);
  const guardado = await insertarPlan(datos);
  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "matricula",
    entidad: "plan", entidadId: guardado.id, resultado: "exito",
  });
  return guardado;
}

export async function obtenerPlanes() {
  return listarPlanes();
}

/**
 * Inscribe a un alumno en un plan y genera el cargo de matrícula
 * correspondiente. Si el usuario indica que ya pagó, registra el pago
 * en el mismo momento — eso deja todo cargado en Pagos sin doble
 * trabajo, y el alumno pasa a "activo" automáticamente (lo resuelve
 * el servicio de Pagos cuando el cargo queda saldado). Si todavía no
 * pagó, el cargo queda pendiente con la fecha límite indicada, y el
 * alumno queda en "pendiente_matricula" como antes.
 */
export async function inscribirAlumno({ alumnoId, planId, fechaInicio, pagado, fecha, medioPago }, contextoAuditoria) {
  const plan = await buscarPlanPorId(planId);
  if (!plan || !plan.activo) throw new Error("El plan no existe o no está activo.");
  if (!fecha) throw new Error("Hace falta la fecha de pago (si ya pagó) o la fecha límite (si no pagó).");

  const datos = crearInscripcion({ alumnoId, planId, fechaInicio });
  const inscripcion = await insertarInscripcion(datos);
  await insertarEventoInscripcion({ inscripcionId: inscripcion.id, evento: "creada", detalle: `Plan: ${plan.nombre}` });

  const conceptoMatricula = await obtenerConceptoPorNombre("Matrícula");
  let cargo = null;
  if (conceptoMatricula) {
    cargo = await generarCargo(
      { alumnoId, conceptoId: conceptoMatricula.id, inscripcionId: inscripcion.id, valor: plan.valor, descuento: 0, fechaVencimiento: fecha },
      contextoAuditoria
    );

    if (pagado) {
      // Esto deja el pago cargado en Pagos Y activa al alumno — no hay
      // que ir a Pagos a registrarlo aparte.
      await registrarPago({ cargoId: cargo.id, valor: plan.valor, fechaPago: fecha, medioPago: medioPago || "No especificado" }, contextoAuditoria);
    }
  }

  if (!pagado) {
    await cambiarEstado(
      { alumnoId, estadoNuevo: "pendiente_matricula", motivo: `Inscripción creada en plan "${plan.nombre}" — pago pendiente` },
      contextoAuditoria
    );
  }

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "matricula",
    entidad: "inscripcion", entidadId: inscripcion.id, resultado: "exito",
  });

  return { ...inscripcion, plan, cargo };
}

export async function obtenerInscripcionesDeAlumno(alumnoId) {
  return inscripcionesDeAlumno(alumnoId);
}
