// backend/src/api/rutas/reportes.js
//
// Rutas NUEVAS, independientes de todo lo demás. No usan requiereAutenticacion
// (login normal) sino requiereApiKeyReportes (header X-Reportes-Key) — pensadas
// para que un proceso externo automatizado (Cowork) las consulte sin sesión.
// Montar en index.js con: app.use('/api/reportes', rutasReportes);

import { Router } from "express";
import { requiereApiKeyReportes } from "../middlewares/autenticacionReportes.js";
import { estudiantesConCumpleanosEnDias } from "../../persistencia/academico/repositorio.js";
import { pagosDeSemana, carteraPendiente } from "../../persistencia/pagos/repositorio.js";

export const rutasReportes = Router();
rutasReportes.use(requiereApiKeyReportes);

// Lunes a domingo de la semana que contiene "hoy" (hora del servidor).
// Devuelve { inicio: 'YYYY-MM-DD', fin: 'YYYY-MM-DD', diasMD: ['MM-DD', ...] }
function semanaActual() {
  const hoy = new Date();
  const diaSemana = hoy.getDay(); // 0=domingo .. 6=sábado
  const offsetHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + offsetHastaLunes);
  lunes.setHours(0, 0, 0, 0);

  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    dias.push(d);
  }

  const aFechaISO = (d) => d.toISOString().slice(0, 10);
  const aMD = (d) => aFechaISO(d).slice(5, 10);

  return {
    inicio: aFechaISO(dias[0]),
    fin: aFechaISO(dias[6]),
    diasMD: dias.map(aMD)
  };
}

rutasReportes.get("/cumpleanos-semana", async (req, res, next) => {
  try {
    const semana = semanaActual();
    const estudiantes = await estudiantesConCumpleanosEnDias(semana.diasMD);
    res.json({
      semana: { inicio: semana.inicio, fin: semana.fin },
      estudiantes: estudiantes.map((e) => ({
        nombre: `${e.nombres} ${e.apellidos}`,
        fechaNacimiento: e.fecha_nacimiento
      }))
    });
  } catch (err) { next(err); }
});

rutasReportes.get("/pagos-semana", async (req, res, next) => {
  try {
    const semana = semanaActual();
    const [pagos, cartera] = await Promise.all([
      pagosDeSemana(semana.inicio, semana.fin),
      carteraPendiente()
    ]);
    res.json({
      semana: { inicio: semana.inicio, fin: semana.fin },
      pagaron: {
        total: pagos.length,
        detalle: pagos.map((p) => ({
          alumno: `${p.nombres} ${p.apellidos}`,
          concepto: p.concepto_nombre,
          valor: Number(p.valor),
          fecha: p.fecha_pago,
          medioPago: p.medio_pago
        }))
      },
      deben: {
        total: cartera.length,
        detalle: cartera.map((c) => ({
          alumno: `${c.nombres} ${c.apellidos}`,
          totalPendiente: Number(c.total_pendiente),
          vencimientoMasAntiguo: c.vencimiento_mas_antiguo
        }))
      }
    });
  } catch (err) { next(err); }
});
