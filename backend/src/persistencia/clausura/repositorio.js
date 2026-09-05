import { pool } from "../../config/db.js";

// Trae, de una sola vez, todos los estudiantes activos junto con las
// canciones que ya tengan asignadas (si las tienen) para el repertorio
// de la Clausura 2026. El frontend arma las tarjetas por curso (programa)
// agrupando este mismo resultado — no hace falta pedir nada por separado.
export async function listarRepertorioDeAlumnos() {
  const alumnos = (await pool.query(
    `SELECT id, nombres, apellidos, programa_principal
     FROM alumnos
     WHERE estado != 'retirado'
     ORDER BY programa_principal, apellidos, nombres`
  )).rows;

  const canciones = (await pool.query(
    `SELECT alumno_id, numero, cancion FROM repertorio_clausura ORDER BY alumno_id, numero`
  )).rows;

  const cancionesPorAlumno = {};
  for (const c of canciones) {
    if (!cancionesPorAlumno[c.alumno_id]) cancionesPorAlumno[c.alumno_id] = [];
    cancionesPorAlumno[c.alumno_id].push(c);
  }

  return alumnos.map((a) => ({
    id: a.id,
    nombres: a.nombres,
    apellidos: a.apellidos,
    programa: a.programa_principal,
    canciones: cancionesPorAlumno[a.id] || [],
  }));
}

// Upsert de una sola canción (numero 1/2/3) de un alumno. Se llama una vez
// por cada canción que venga en el body al guardar (ver servicio.js) — así
// el UNIQUE (alumno_id, numero) decide solo si es alta o corrección.
export async function guardarCancionDeAlumno(alumnoId, numero, cancion) {
  const { rows } = await pool.query(
    `INSERT INTO repertorio_clausura (alumno_id, numero, cancion)
     VALUES ($1,$2,$3)
     ON CONFLICT (alumno_id, numero) DO UPDATE SET cancion = EXCLUDED.cancion, actualizado_en = now()
     RETURNING alumno_id, numero, cancion`,
    [alumnoId, numero, cancion]
  );
  return rows[0];
}
