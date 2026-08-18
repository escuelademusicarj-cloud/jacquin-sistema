import { Router } from "express";
import * as srv from "../../servicios/contabilidad/servicio.js";
import { respuestaExitosa } from "../middlewares/manejoErrores.js";
import { requiereAutenticacion } from "../middlewares/autenticacion.js";
import { requierePermiso } from "../middlewares/autorizacion.js";

export const rutasContabilidad = Router();
rutasContabilidad.use(requiereAutenticacion);
const ver = requierePermiso("contabilidad:ver");
const crear = requierePermiso("contabilidad:crear");
const ctx = (req) => ({ usuarioId: req.usuario?.id ?? null });

// Ingresos
rutasContabilidad.get("/ingresos", ver, async (req, res, next) => { try { respuestaExitosa(res, await srv.obtenerIngresos()); } catch (e) { next(e); } });
rutasContabilidad.post("/ingresos", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.crearIngresoNuevo(req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.put("/ingresos/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.editarIngreso(req.params.id, req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.delete("/ingresos/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.borrarIngreso(req.params.id, ctx(req))); } catch (e) { next(e); } });

// Gastos
rutasContabilidad.get("/gastos", ver, async (req, res, next) => { try { respuestaExitosa(res, await srv.obtenerGastos()); } catch (e) { next(e); } });
rutasContabilidad.post("/gastos", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.crearGastoNuevo(req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.put("/gastos/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.editarGasto(req.params.id, req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.delete("/gastos/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.borrarGasto(req.params.id, ctx(req))); } catch (e) { next(e); } });

// Compras
rutasContabilidad.get("/compras", ver, async (req, res, next) => { try { respuestaExitosa(res, await srv.obtenerCompras()); } catch (e) { next(e); } });
rutasContabilidad.post("/compras", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.crearCompraNueva(req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.put("/compras/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.editarCompra(req.params.id, req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.delete("/compras/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.borrarCompra(req.params.id, ctx(req))); } catch (e) { next(e); } });

// Nómina
rutasContabilidad.get("/nomina", ver, async (req, res, next) => { try { respuestaExitosa(res, await srv.obtenerNomina()); } catch (e) { next(e); } });
rutasContabilidad.post("/nomina", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.crearNominaNueva(req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.put("/nomina/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.editarNomina(req.params.id, req.body, ctx(req))); } catch (e) { next(e); } });
rutasContabilidad.delete("/nomina/:id", crear, async (req, res, next) => { try { respuestaExitosa(res, await srv.borrarNomina(req.params.id, ctx(req))); } catch (e) { next(e); } });
