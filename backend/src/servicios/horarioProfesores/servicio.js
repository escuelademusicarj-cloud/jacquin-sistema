import { crearAsignacionHorarioProfesor } from "../../dominio/horarioProfesores/entidades.js";
import {
  listarHorarioProfesores, buscarAsignacionDeProfesor, insertarAsignacionHorarioProfesor,
  buscarAsignacionPorId, eliminarAsignacionHorarioProfesor,
} from "../../persistencia/horarioProfesores/repositorio.js";
import { registrarAuditoria } from "../../auditoria/servicio.js";

export async function obtenerHorarioProfesores() {
  return listarHorarioProfesores();
}

/**
 * Asigna un profesor a una franja del horario semanal. A propósito
 * permite varios profesores distintos en la misma franja (sin límite,
 * pedido explícito) — solo se valida que ESE profesor puntual no esté
 * ya puesto en esa misma franja (no puede dictar dos cursos a la vez).
 */
export async function asignarProfesorAHorario({ profesorId, programa, diaSemana, horaInicio }, contextoAuditoria) {
  const datos = crearAsignacionHorarioProfesor({ profesorId, programa, diaSemana, horaInicio });

  const yaExiste = await buscarAsignacionDeProfesor(datos.profesorId, datos.diaSemana, datos.horaInicio);
  if (yaExiste) {
    throw new Error("Ese profesor ya tiene algo asignado en esa franja — quitalo primero si querés cambiarlo.");
  }

  const guardada = await insertarAsignacionHorarioProfesor(datos);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "crear", modulo: "horarioprofesores",
    entidad: "horario_profesor", entidadId: guardada.id, resultado: "exito",
  });

  return guardada;
}

export async function quitarProfesorDeHorario(id, contextoAuditoria) {
  const existente = await buscarAsignacionPorId(id);
  if (!existente) throw new Error("Esa asignación ya no existe.");

  await eliminarAsignacionHorarioProfesor(id);

  await registrarAuditoria({
    usuarioId: contextoAuditoria?.usuarioId ?? null, accion: "eliminar", modulo: "horarioprofesores",
    entidad: "horario_profesor", entidadId: id, resultado: "exito",
  });

  return { id };
}
