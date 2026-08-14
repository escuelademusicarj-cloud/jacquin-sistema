// API: convención única de respuesta para toda la API, éxito y error.
// { data, error, meta } — así el frontend nunca tiene que adivinar
// la forma de la respuesta según el endpoint.
export function respuestaExitosa(res, data, meta = null) {
  res.json({ data, error: null, meta });
}

export function manejoErrores(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const codigoHttp = err.codigoHttp ?? 500;
  res.status(codigoHttp).json({
    data: null,
    error: {
      codigo: err.codigo ?? "error_interno",
      mensaje: err.message ?? "Ocurrió un error inesperado.",
    },
    meta: null,
  });
}
