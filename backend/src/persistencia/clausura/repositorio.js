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

// ---- Ensambles: grupos de estudiantes de distintos cursos que tocan
// juntos una misma pieza (ej. 2 pianistas + 4 percusionistas + 2 violines).
// Un ensamble no pertenece a un solo programa, por eso es una entidad
// aparte con su propia tabla de integrantes (muchos a muchos con alumnos).
export async function listarEnsambles() {
  const ensambles = (await pool.query(
    `SELECT id, nombre, cancion, notas FROM clausura_ensambles ORDER BY id`
  )).rows;

  const integrantes = (await pool.query(
    `SELECT ei.ensamble_id, a.id AS alumno_id, a.nombres, a.apellidos, a.programa_principal AS programa
     FROM clausura_ensamble_integrantes ei
     JOIN alumnos a ON a.id = ei.alumno_id
     ORDER BY ei.ensamble_id, a.apellidos, a.nombres`
  )).rows;

  const integrantesPorEnsamble = {};
  for (const i of integrantes) {
    if (!integrantesPorEnsamble[i.ensamble_id]) integrantesPorEnsamble[i.ensamble_id] = [];
    integrantesPorEnsamble[i.ensamble_id].push({
      alumnoId: i.alumno_id, nombres: i.nombres, apellidos: i.apellidos, programa: i.programa,
    });
  }

  return ensambles.map((e) => ({ ...e, integrantes: integrantesPorEnsamble[e.id] || [] }));
}

export async function crearEnsamble({ nombre, cancion, notas }) {
  const { rows } = await pool.query(
    `INSERT INTO clausura_ensambles (nombre, cancion, notas) VALUES ($1,$2,$3) RETURNING *`,
    [nombre, cancion || null, notas || null]
  );
  return rows[0];
}

export async function editarEnsamble(id, { nombre, cancion, notas }) {
  const { rows } = await pool.query(
    `UPDATE clausura_ensambles SET nombre=$1, cancion=$2, notas=$3 WHERE id=$4 RETURNING *`,
    [nombre, cancion || null, notas || null, id]
  );
  return rows[0] ?? null;
}

export async function borrarEnsamble(id) {
  await pool.query(`DELETE FROM clausura_ensambles WHERE id=$1`, [id]);
}

export async function agregarIntegranteEnsamble(ensambleId, alumnoId) {
  await pool.query(
    `INSERT INTO clausura_ensamble_integrantes (ensamble_id, alumno_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
    [ensambleId, alumnoId]
  );
}

export async function quitarIntegranteEnsamble(ensambleId, alumnoId) {
  await pool.query(
    `DELETE FROM clausura_ensamble_integrantes WHERE ensamble_id=$1 AND alumno_id=$2`,
    [ensambleId, alumnoId]
  );
}
