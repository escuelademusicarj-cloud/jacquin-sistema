import {
  fechaHoyColombia, listarPersonalConLlegadas, buscarPersonal,
  registrarLlegadaHoy, quitarHoraLlegada, buscarRegistroDelDia, marcarNoAsistio, guardarObservacion, listarLlegadasDelMes,
} from "../../persistencia/llegadas/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function error(mensaje, codigoHttp) {
  const err = new Error(mensaje);
  err.codigoHttp = codigoHttp;
  return err;
}

async function personalValido(usuarioId) {
  const persona = await buscarPersonal(usuarioId);
  if (!persona) throw error("Esa persona no es parte del personal (Profesor o Secretaría).", 404);
  return persona;
}

// Regla pedida por Sergio: la Secretaría solo corrige el registro del mismo
// día. Administración puede corregir cualquier día.
async function validarDiaEditable(fecha, rol) {
  const hoy = await fechaHoyColombia();
  if (fecha !== hoy && rol !== "ADMINISTRADOR") {
    throw error("Solo se puede corregir el registro del día de hoy. Para días anteriores, pídaselo a Administración.", 403);
  }
  return hoy;
}

export async function obtenerLlegadasDelDia(fecha) {
  const hoy = await fechaHoyColombia();
  const dia = fecha && FORMATO_FECHA.test(fecha) ? fecha : hoy;
  return { fecha: dia, hoy, personal: await listarPersonalConLlegadas(dia) };
}

export async function registrarLlegada(usuarioId, contexto) {
  await personalValido(usuarioId);
  const registro = await registrarLlegadaHoy(usuarioId, contexto.usuarioId);
  if (!registro) {
    const hoy = await fechaHoyColombia();
    const actual = await buscarRegistroDelDia(usuarioId, hoy);
    if (actual?.no_asistio) throw error("Esta persona está marcada como \"No asistió\" hoy. Si llegó, use \"Corregir\" primero.", 409);
    throw error("Esta persona ya tiene la llegada registrada hoy. Si fue un error, use \"Corregir\" primero.", 409);
  }

  await registrarAuditoria({
    usuarioId: contexto.usuarioId, accion: "crear", modulo: "llegadas",
    entidad: "llegada_personal", entidadId: usuarioId, resultado: "exito",
  });
  return registro;
}

export async function registrarNoAsistio(usuarioId, fecha, contexto) {
  const hoy = await fechaHoyColombia();
  const dia = fecha || hoy;
  if (!FORMATO_FECHA.test(dia)) throw error("Fecha inválida.", 400);
  if (dia > hoy) throw error("No se puede marcar un día que todavía no ha llegado.", 400);
  await personalValido(usuarioId);
  await validarDiaEditable(dia, contexto.rol);
  const marcado = await marcarNoAsistio(usuarioId, dia, contexto.usuarioId);
  if (!marcado) throw error("Esta persona ya tiene la llegada registrada ese día. Si fue un error, use \"Corregir\" primero.", 409);

  await registrarAuditoria({
    usuarioId: contexto.usuarioId, accion: "editar", modulo: "llegadas",
    entidad: "llegada_personal", entidadId: usuarioId, resultado: "exito",
  });
  return { fecha: dia, noAsistio: true };
}

export async function corregirLlegada(usuarioId, fecha, contexto) {
  if (!FORMATO_FECHA.test(fecha || "")) throw error("Fecha inválida.", 400);
  await personalValido(usuarioId);
  await validarDiaEditable(fecha, contexto.rol);
  await quitarHoraLlegada(usuarioId, fecha);

  await registrarAuditoria({
    usuarioId: contexto.usuarioId, accion: "eliminar", modulo: "llegadas",
    entidad: "llegada_personal", entidadId: usuarioId, resultado: "exito",
  });
  return { ok: true };
}

export async function editarObservacion(usuarioId, fecha, observaciones, contexto) {
  if (!FORMATO_FECHA.test(fecha || "")) throw error("Fecha inválida.", 400);
  await personalValido(usuarioId);
  await validarDiaEditable(fecha, contexto.rol);
  const texto = String(observaciones ?? "").trim().slice(0, 500);
  await guardarObservacion(usuarioId, fecha, texto, contexto.usuarioId);

  await registrarAuditoria({
    usuarioId: contexto.usuarioId, accion: "editar", modulo: "llegadas",
    entidad: "llegada_personal", entidadId: usuarioId, resultado: "exito",
  });
  return { observaciones: texto };
}

export async function obtenerReporteMensual(usuarioId, mes) {
  if (!FORMATO_MES.test(mes || "")) throw error("Mes inválido (formato esperado AAAA-MM).", 400);
  const persona = await personalValido(usuarioId);
  return {
    usuario: { id: persona.id, nombre: persona.nombre, rol: persona.rol },
    mes,
    registros: await listarLlegadasDelMes(usuarioId, mes),
  };
}
