// backend/src/api/middlewares/autenticacionReportes.js
//
// Middleware NUEVO, independiente de requiereAutenticacion (el de sesión/JWT
// normal). Protege únicamente las rutas de /api/reportes con una API key
// propia, dedicada solo a lectura de reportes — nunca tu contraseña de
// administrador ni un token de sesión.
//
// La key se define como variable de entorno REPORTES_API_KEY en Vercel
// (Project Settings → Environment Variables).
//
// Acepta la key de DOS formas (lo que llegue primero, header o URL):
//   1) Header "X-Reportes-Key" (para pruebas manuales con Postman, curl, etc.)
//   2) Parámetro en la URL "?key=..." (para Cowork, que solo puede abrir
//      una URL normal y no puede enviar headers personalizados)

export function requiereApiKeyReportes(req, res, next) {
  const keyEsperada = process.env.REPORTES_API_KEY;
  const keyRecibida = req.header("X-Reportes-Key") || req.query.key;

  if (!keyEsperada) {
    // Falta configurar la variable de entorno en Vercel — no dejamos pasar
    // por defecto (fallaría "abierto", inseguro).
    return res.status(500).json({ error: "REPORTES_API_KEY no está configurada en el servidor." });
  }
  if (!keyRecibida || keyRecibida !== keyEsperada) {
    return res.status(401).json({ error: "No autorizado." });
  }
  next();
}
