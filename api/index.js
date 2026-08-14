// Vercel busca funciones serverless en /api. Esta es la única — reexporta
// la app de Express completa (con todas las rutas ya montadas), así no
// hay que duplicar nada ni crear una función por endpoint.
import app from "../backend/src/index.js";

export default app;
