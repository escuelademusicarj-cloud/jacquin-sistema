-- Migración 001 — Fase 0: Core Arquitectónico.
-- Solo identidad, roles, permisos y auditoría. Las tablas de negocio
-- (estudiantes, matrícula, horarios, pagos, asistencia, evaluación)
-- se agregan en migraciones posteriores, una por fase, no acá.

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    clave TEXT UNIQUE NOT NULL, -- convención "modulo:accion", ej. "identidad:crear"
    descripcion TEXT
);

CREATE TABLE rol_permisos (
    rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INTEGER REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol_id INTEGER REFERENCES roles(id),
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE auditoria_log (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion TEXT NOT NULL,
    modulo TEXT NOT NULL,
    entidad TEXT NOT NULL,
    entidad_id INTEGER,
    resultado TEXT NOT NULL,
    fecha_hora TIMESTAMP DEFAULT now()
);

-- Seed de roles iniciales (catálogo abierto, se pueden agregar más sin migración).
INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMINISTRADOR', 'Control total del sistema'),
    ('SECRETARIA', 'Gestión operativa diaria: matrícula, horarios, pagos'),
    ('PROFESOR', 'Acceso a su propia agenda y al progreso de sus alumnos'),
    ('DIRECCION', 'Visión general y reportes de la academia');
