import { pool } from "../../config/db.js";

export async function upsertPerfil(perfil) {
  const { rows } = await pool.query(
    `INSERT INTO perfiles_profesor (usuario_id, telefono, instrumentos, experiencia)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (usuario_id) DO UPDATE SET telefono = EXCLUDED.telefono, instrumentos = EXCLUDED.instrumentos, experiencia = EXCLUDED.experiencia
     RETURNING *`,
    [perfil.usuarioId, perfil.telefono, perfil.instrumentos, perfil.experiencia]
  );
  return rows[0];
}

export async function listarProfesores() {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.email, p.telefono, p.instrumentos, p.experiencia
     FROM usuarios u
     JOIN roles r ON r.id = u.rol_id
     LEFT JOIN perfiles_profesor p ON p.usuario_id = u.id
     WHERE r.nombre = 'PROFESOR'
     ORDER BY u.nombre`
  );
  return rows;
}

export async function insertarDisponibilidad(d) {
  const { rows } = await pool.query(
    `INSERT INTO disponibilidad_profesor (usuario_id, dia_semana, hora_inicio, hora_fin) VALUES ($1,$2,$3,$4) RETURNING *`,
    [d.usuarioId, d.diaSemana, d.horaInicio, d.horaFin]
  );
  return rows[0];
}

export async function disponibilidadDeProfesor(usuarioId) {
  const { rows } = await pool.query(
    `SELECT * FROM disponibilidad_profesor WHERE usuario_id = $1 ORDER BY dia_semana, hora_inicio`,
    [usuarioId]
  );
  return rows;
}
