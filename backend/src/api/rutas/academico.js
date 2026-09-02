import { Router } from "express";
import { altaAlumno, obtenerAlumno, obtenerListaAlumnos, editarAlumno, cambiarEstado } from "../../servicios/academico/servicio.js";
import { PROGRAMAS_OFICIALES, ESTADOS_ALUMNO } from "../../dominio/academico/entidades.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasAcademico = Router();
rutasAcademico.use(requiereAutenticacion);

// Catálogos de referencia para poblar selects del frontend.
rutasAcademico.get("/catalogos", requierePermiso("academico:ver"), (req, res) => {
  respuestaExitosa(res, { programas: PROGRAMAS_OFICIALES, estados: ESTADOS_ALUMNO });
});

rutasAcademico.get("/estudiantes", requierePermiso("academico:ver"), async (req, res, next) => {
  try {
    const lista = await obtenerListaAlumnos({ estado: req.query.estado }, { rol: req.usuario.rol, usuarioId: req.usuario.id });
    respuestaExitosa(res, lista);
  } catch (err) { next(err); }
});

rutasAcademico.get("/estudiantes/:id", requierePermiso("academico:ver"), async (req, res, next) => {
  try {
    const alumno = await obtenerAlumno(req.params.id, { rol: req.usuario.rol, usuarioId: req.usuario.id });
    if (!alumno) return res.status(404).json({ data: null, error: { codigo: "no_encontrado", mensaje: "Alumno no encontrado." }, meta: null });
    respuestaExitosa(res, alumno);
  } catch (err) { next(err); }
});

rutasAcademico.post("/estudiantes", requierePermiso("academico:crear"), async (req, res, next) => {
  try {
    const resultado = await altaAlumno(req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, resultado);
  } catch (err) { next(err); }
});

// NUEVO: edita los datos de un estudiante ya existente (nombres, contacto,
// programa, profesor asignado, observaciones) — antes esta ruta no
// existía y el botón "Guardar cambios" del editor le pegaba a un 404.
rutasAcademico.put("/estudiantes/:id", requierePermiso("academico:crear"), async (req, res, next) => {
  try {
    const actualizado = await editarAlumno(req.params.id, req.body, { usuarioId: req.usuario?.id ?? null });
    respuestaExitosa(res, actualizado);
  } catch (err) { next(err); }
});

rutasAcademico.patch("/estudiantes/:id/estado", requierePermiso("academico:crear"), async (req, res, next) => {
  try {
    const actualizado = await cambiarEstado(
      { alumnoId: req.params.id, estadoNuevo: req.body.estado, motivo: req.body.motivo },
      { usuarioId: req.usuario?.id ?? null }
    );
    respuestaExitosa(res, actualizado);
  } catch (err) { next(err); }
});
