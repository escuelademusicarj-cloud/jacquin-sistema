-- Migración 003 — Fase 2: módulo Estudiantes (MVP, prioridad 1 según Sergio).
-- El catálogo de programas queda como lista fija validada en el dominio
-- (no una tabla propia todavía) porque el módulo de Cursos y Programas
-- no está construido — se puede migrar a tabla real cuando se construya
-- ese módulo, sin romper esta.

CREATE TABLE alumnos (
    id SERIAL PRIMARY KEY,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    documento TEXT,
    fecha_nacimiento DATE,
    telefono_contacto TEXT,
    email_contacto TEXT,
    programa_principal TEXT NOT NULL, -- ver dominio/academico/entidades.js: PROGRAMAS_OFICIALES
    profesor_id INTEGER REFERENCES usuarios(id),
    estado TEXT NOT NULL DEFAULT 'preinscrito'
        CHECK (estado IN ('activo', 'inactivo', 'retirado', 'preinscrito', 'pendiente_matricula')),
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT now(),
    actualizado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE acudientes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    documento TEXT,
    telefono TEXT,
    email TEXT,
    creado_en TIMESTAMP DEFAULT now()
);

-- N:N — un alumno puede tener más de un acudiente (confirmado por Sergio),
-- y un mismo acudiente puede estar vinculado a más de un alumno (hermanos).
CREATE TABLE alumno_acudientes (
    alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    acudiente_id INTEGER REFERENCES acudientes(id) ON DELETE CASCADE,
    relacion TEXT, -- ej. "madre", "padre", "tutor legal"
    PRIMARY KEY (alumno_id, acudiente_id)
);

-- Historial nunca se borra (regla explícita de Sergio) — esta tabla
-- registra cada cambio de estado del alumno, no se sobreescribe.
CREATE TABLE alumno_historial_estados (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL,
    motivo TEXT,
    fecha TIMESTAMP DEFAULT now()
);

INSERT INTO permisos (clave, descripcion) VALUES
    ('academico:ver', 'Ver estudiantes y acudientes'),
    ('academico:crear', 'Crear y editar estudiantes y acudientes');

-- Administración y Secretaría gestionan estudiantes; Dirección solo consulta.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.clave IN ('academico:ver', 'academico:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave IN ('academico:ver', 'academico:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'academico:ver';

-- Profesor: acceso a "sus" estudiantes es un filtrado por fila (no por
-- permiso binario) — pendiente de diseñar cuando se implemente ese
-- alcance; no se le asigna el permiso general todavía para no exponer
-- de más mientras tanto.
