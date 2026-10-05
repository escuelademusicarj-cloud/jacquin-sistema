import { pool } from "../../config/db.js";

// Toda fecha/hora se calcula en hora de Colombia dentro de Postgres y sale
// como texto (to_char) — así no se mezcla con la zona horaria de Vercel
// (UTC) ni con la conversión automática de DATE a objeto Date de `pg`.
const ZONA = "America/Bogota";
const ROLES_PERSONAL = ["PROFESOR", "SECRETARIA"];

export async function ahoraColombia() {
  const { rows } = await pool.query(
    `SELECT to_char(now() AT TIME ZONE '${ZONA}', 'YYYY-MM-DD') AS hoy,
            to_char(now() AT TIME ZONE '${ZONA}', 'HH24:MI') AS hora`
  );
  return rows[0];
}

export async function fechaHoyColombia() {
  const { rows } = await pool.query(
    `SELECT to_char((now() AT TIME ZONE '${ZONA}')::date, 'YYYY-MM-DD') AS hoy`
  );
  return rows[0].hoy;
}

// Personal (Profesor + Secretaría) con lo que tenga registrado ese día.
// Incluye a alguien ya desactivado solo si tiene registro en esa fecha,
// para que los días pasados no "pierdan" gente.
export async function listarPersonalConLlegadas(fecha) {
  const { rows } = await pool.query(
    `SELECT u.id AS usuario_id, u.nombre, r.nombre AS rol,
            to_char(l.hora_llegada AT TIME ZONE '${ZONA}', 'HH24:MI') AS hora,
            COALESCE(l.no_asistio, false) AS no_asistio,
            COALESCE(l.hora_editada, false) AS hora_editada, l.observaciones
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     LEFT JOIN llegadas_personal l ON l.usuario_id = u.id AND l.fecha = $1::date
     WHERE r.nombre = ANY($2) AND (u.activo = true OR l.id IS NOT NULL)
     ORDER BY u.nombre`,
    [fecha, ROLES_PERSONAL]
  );
  return rows.map((f) => ({
    usuarioId: f.usuario_id, nombre: f.nombre, rol: f.rol,
    hora: f.hora, noAsistio: f.no_asistio, horaEditada: f.hora_editada, observaciones: f.observaciones || "",
  }));
}

// Semana completa (desde el lunes, 7 días): personal + registros de esos días.
export async function listarSemana(lunes) {
  const { rows: personal } = await pool.query(
    `SELECT u.id AS usuario_id, u.nombre, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     WHERE r.nombre = ANY($2)
       AND (u.activo = true OR EXISTS (
         SELECT 1 FROM llegadas_personal l
         WHERE l.usuario_id = u.id AND l.fecha >= $1::date AND l.fecha < $1::date + 7))
     ORDER BY u.nombre`,
    [lunes, ROLES_PERSONAL]
  );
  const { rows: registros } = await pool.query(
    `SELECT l.usuario_id, to_char(l.fecha, 'YYYY-MM-DD') AS fecha,
            to_char(l.hora_llegada AT TIME ZONE '${ZONA}', 'HH24:MI') AS hora,
            l.no_asistio, l.hora_editada, l.observaciones
     FROM llegadas_personal l
     JOIN usuarios u ON u.id = l.usuario_id
     JOIN roles r ON r.id = u.rol_id
     WHERE r.nombre = ANY($2) AND l.fecha >= $1::date AND l.fecha < $1::date + 7`,
    [lunes, ROLES_PERSONAL]
  );
  return {
    personal: personal.map((f) => ({ usuarioId: f.usuario_id, nombre: f.nombre, rol: f.rol })),
    registros: registros.map((f) => ({
      usuarioId: f.usuario_id, fecha: f.fecha, hora: f.hora, noAsistio: f.no_asistio,
      horaEditada: f.hora_editada, observaciones: f.observaciones || "",
    })),
  };
}

export async function buscarPersonal(usuarioId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.activo, r.nombre AS rol
     FROM usuarios u JOIN roles r ON r.id = u.rol_id
     WHERE u.id = $1 AND r.nombre = ANY($2)`,
    [usuarioId, ROLES_PERSONAL]
  );
  return rows[0] ?? null;
}

// Registra la llegada de HOY con la hora del servidor. Si ya había hora
// registrada no la pisa (devuelve null) — evita que un doble clic le
// cambie la hora a alguien. Si solo había observación, le agrega la hora.
export async function registrarLlegadaHoy(usuarioId, registradoPor) {
  const { rows } = await pool.query(
    `INSERT INTO llegadas_personal (usuario_id, fecha, hora_llegada, registrado_por)
     VALUES ($1, (now() AT TIME ZONE '${ZONA}')::date, now(), $2)
     ON CONFLICT (usuario_id, fecha) DO UPDATE
       SET hora_llegada = now(), hora_editada = false, registrado_por = EXCLUDED.registrado_por, actualizado_en = now()
       WHERE llegadas_personal.hora_llegada IS NULL AND llegadas_personal.no_asistio = false
     RETURNING to_char(fecha, 'YYYY-MM-DD') AS fecha,
               to_char(hora_llegada AT TIME ZONE '${ZONA}', 'HH24:MI') AS hora`,
    [usuarioId, registradoPor]
  );
  return rows[0] ?? null;
}

// Pone o cambia la hora de llegada a mano (la secretaria no alcanzó a darle
// clic en el momento). La hora llega como 'HH:MM' en hora de Colombia y se
// guarda como instante real. Quita el "No asistió" si lo tenía y deja la
// marca hora_editada = true para que se note que no fue con el clic.
export async function ponerHoraManual(usuarioId, fecha, hora, registradoPor) {
  const { rows } = await pool.query(
    `INSERT INTO llegadas_personal (usuario_id, fecha, hora_llegada, hora_editada, registrado_por)
     VALUES ($1, $2::date, ($2::date + $3::time) AT TIME ZONE '${ZONA}', true, $4)
     ON CONFLICT (usuario_id, fecha) DO UPDATE
       SET hora_llegada = EXCLUDED.hora_llegada, no_asistio = false, hora_editada = true,
           registrado_por = EXCLUDED.registrado_por, actualizado_en = now()
     RETURNING to_char(fecha, 'YYYY-MM-DD') AS fecha,
               to_char(hora_llegada AT TIME ZONE '${ZONA}', 'HH24:MI') AS hora`,
    [usuarioId, fecha, hora, registradoPor]
  );
  return rows[0];
}

// Estado del día de una persona (para saber por qué no se pudo registrar).
export async function buscarRegistroDelDia(usuarioId, fecha) {
  const { rows } = await pool.query(
    `SELECT hora_llegada IS NOT NULL AS tiene_hora, no_asistio
     FROM llegadas_personal WHERE usuario_id = $1 AND fecha = $2::date`,
    [usuarioId, fecha]
  );
  return rows[0] ?? null;
}

// Marca "No asistió" ese día. Solo si no tiene hora de llegada registrada.
export async function marcarNoAsistio(usuarioId, fecha, registradoPor) {
  const { rows } = await pool.query(
    `INSERT INTO llegadas_personal (usuario_id, fecha, no_asistio, registrado_por)
     VALUES ($1, $2::date, true, $3)
     ON CONFLICT (usuario_id, fecha) DO UPDATE
       SET no_asistio = true, registrado_por = EXCLUDED.registrado_por, actualizado_en = now()
       WHERE llegadas_personal.hora_llegada IS NULL
     RETURNING id`,
    [usuarioId, fecha, registradoPor]
  );
  return rows.length > 0;
}

// Quita la hora o el "No asistió" (corrección por clic equivocado). Si el día no queda con
// observación, se borra la fila completa para no dejar registros vacíos.
export async function quitarHoraLlegada(usuarioId, fecha) {
  await pool.query(
    `UPDATE llegadas_personal SET hora_llegada = NULL, no_asistio = false, hora_editada = false, actualizado_en = now()
     WHERE usuario_id = $1 AND fecha = $2::date`,
    [usuarioId, fecha]
  );
  await pool.query(
    `DELETE FROM llegadas_personal
     WHERE usuario_id = $1 AND fecha = $2::date
       AND hora_llegada IS NULL AND no_asistio = false AND COALESCE(observaciones, '') = ''`,
    [usuarioId, fecha]
  );
}

export async function guardarObservacion(usuarioId, fecha, observaciones, registradoPor) {
  await pool.query(
    `INSERT INTO llegadas_personal (usuario_id, fecha, observaciones, registrado_por)
     VALUES ($1, $2::date, $3, $4)
     ON CONFLICT (usuario_id, fecha) DO UPDATE
       SET observaciones = EXCLUDED.observaciones, actualizado_en = now()`,
    [usuarioId, fecha, observaciones, registradoPor]
  );
  await pool.query(
    `DELETE FROM llegadas_personal
     WHERE usuario_id = $1 AND fecha = $2::date
       AND hora_llegada IS NULL AND no_asistio = false AND COALESCE(observaciones, '') = ''`,
    [usuarioId, fecha]
  );
}

// Todos los días con registro de una persona en un mes ('YYYY-MM').
export async function listarLlegadasDelMes(usuarioId, mes) {
  const { rows } = await pool.query(
    `SELECT to_char(fecha, 'YYYY-MM-DD') AS fecha,
            to_char(hora_llegada AT TIME ZONE '${ZONA}', 'HH24:MI') AS hora,
            no_asistio, hora_editada, observaciones
     FROM llegadas_personal
     WHERE usuario_id = $1
       AND fecha >= ($2 || '-01')::date
       AND fecha < (($2 || '-01')::date + INTERVAL '1 month')
     ORDER BY fecha`,
    [usuarioId, mes]
  );
  return rows.map((f) => ({ fecha: f.fecha, hora: f.hora, noAsistio: f.no_asistio, horaEditada: f.hora_editada, observaciones: f.observaciones || "" }));
}
