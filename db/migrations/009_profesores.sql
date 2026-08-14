-- Migración 009 — módulo Profesores (soporte de Horarios/Asistencia).
-- No estaba en el top 5 de prioridades de Sergio, pero es prerequisito
-- real: Horarios necesita elegir profesores con más que solo login.
-- El usuario/login ya existe (Identidad, Fase 1) — esto es el PERFIL
-- extendido: instrumentos, disponibilidad, experiencia.

CREATE TABLE perfiles_profesor (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    telefono TEXT,
    instrumentos TEXT, -- lista separada por coma, ej. "Piano, Guitarra acústica"
    experiencia TEXT,
    creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE disponibilidad_profesor (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) NOT NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
);

-- Reutiliza el permiso "identidad:ver"/"identidad:crear" no alcanza
-- (eso es para usuarios en general) — un permiso propio para el perfil
-- de profesor, independiente de la gestión de cuentas.
INSERT INTO permisos (clave, descripcion) VALUES
    ('profesores:ver', 'Ver perfiles y disponibilidad de profesores'),
    ('profesores:crear', 'Crear y editar perfiles de profesores');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.clave IN ('profesores:ver', 'profesores:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave = 'profesores:ver';

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'profesores:ver';

-- Un profesor puede ver y editar su propio perfil (disponibilidad,
-- experiencia) — filtrado por fila igual que en los demás módulos.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'PROFESOR' AND p.clave IN ('profesores:ver', 'profesores:crear');
