import { validarEnlaceDrive } from "../../dominio/pensum/entidades.js";
import { listarPensumCompleto, buscarTemaPorId, actualizarEnlaceTema } from "../../persistencia/pensum/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerPensum() {
  return listarPensumCompleto();
}

export async function editarEnlaceDeTema(id, enlaceDrive, contextoAuditoria) {
  const existente = await buscarTemaPorId(id);
  if (!existente) {
    const err = new Error("Tema no encontrado.");
    err.codigoHttp = 404;
    throw err;
  }
  const validado = validarEnlaceDrive(enlaceDrive);
  const actualizado = await actualizarEnlaceTema(id, validado);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "editar", modulo: "pensum",
    entidad: "tema", entidadId: id, resultado: "exito",
  });

  return actualizado;
}
