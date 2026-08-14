import express from "express";
import cors from "cors";
import "dotenv/config";
import { rutasIdentidad } from "./api/rutas/identidad.js";
import { rutasAcademico } from "./api/rutas/academico.js";
import { rutasMatricula } from "./api/rutas/matricula.js";
import { rutasPagos } from "./api/rutas/pagos.js";
import { rutasHorarios } from "./api/rutas/horarios.js";
import { rutasAsistencia } from "./api/rutas/asistencia.js";
import { rutasProfesores } from "./api/rutas/profesores.js";
import { manejoErrores, respuestaExitosa } from "./api/middlewares/manejoErrores.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/salud", (req, res) => respuestaExitosa(res, { estado: "ok", fase: "0 - core arquitectonico" }));

// Un módulo, una ruta montada bajo /api/<modulo>. Los módulos de
// negocio (académico, operativo, financiero, seguimiento) se montan
// acá recién cuando se construyan en sus fases correspondientes.
app.use("/api/identidad", rutasIdentidad);
app.use("/api/academico", rutasAcademico);
app.use("/api/matricula", rutasMatricula);
app.use("/api/pagos", rutasPagos);
app.use("/api/horarios", rutasHorarios);
app.use("/api/asistencia", rutasAsistencia);
app.use("/api/profesores", rutasProfesores);

app.use(manejoErrores);

// Local (npm run dev): levanta un servidor real.
// Vercel: NO llama a listen() — importa `app` como función serverless
// (ver /api/index.js en la raíz del proyecto).
if (process.env.VERCEL !== "1") {
  const PUERTO = process.env.PUERTO || 3001;
  app.listen(PUERTO, () => console.log(`Backend Jacquin escuchando en puerto ${PUERTO}`));
}

export default app;
