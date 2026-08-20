// backend/src/api/middlewares/autenticacionReportes.js
//
// Middleware NUEVO, independiente de requiereAutenticacion (el de sesión/JWT
// normal). Protege únicamente las rutas de /api/reportes con una API key
// propia, dedicada solo a lectura de reportes — nunca tu contraseña de
// administrador ni un token de sesión.
//
// La key se define como variable de entorno REPORTES_API_KEY en Vercel
// (Project Settings → Environment Variables). Generarla una sola vez con,
// por ejemplo: `openssl rand -hex 32` en tu terminal, y pegar el resultado
// como valor de esa variable. No se sube al repo.

export function requiereApiKeyReportes(req, res, next) {
  const keyEsperada = process.env.REPORTES_API_KEY;
  const keyRecibida = req.header("X-Reportes-Key");

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
