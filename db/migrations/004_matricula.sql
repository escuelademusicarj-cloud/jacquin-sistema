-- Migración 004 — Fase 2: módulo Matrícula (MVP, prioridad 2).
-- Los planes/tarifas son una TABLA, no valores hardcodeados — Sergio
-- pidió explícitamente poder configurarlos sin tocar código.

CREATE TABLE planes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL, -- ej. "Piano — 2 clases/semana"
    programa TEXT NOT NULL, -- debe coincidir con PROGRAMAS_OFICIALES del dominio académico
    frecuencia_semanal INTEGER, -- clases por semana, informativo
    valor NUMERIC(12,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE inscripciones (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER REFERENCES alumnos(id) NOT NULL,
    plan_id INTEGER REFERENCES planes(id) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'dada_de_baja')),
    creado_en TIMESTAMP DEFAULT now()
);

-- Historial de matrícula — igual criterio que alumno_historial_estados:
-- nunca se borra, regla explícita de Sergio ("si cambia de programa,
-- se actualiza sin perder la información anterior").
CREATE TABLE inscripcion_historial (
    id SERIAL PRIMARY KEY,
    inscripcion_id INTEGER REFERENCES inscripciones(id) ON DELETE CASCADE,
    evento TEXT NOT NULL, -- 'creada', 'cambio_plan', 'pausada', 'dada_de_baja', 'reactivada'
    detalle TEXT,
    fecha TIMESTAMP DEFAULT now()
);

INSERT INTO permisos (clave, descripcion) VALUES
    ('matricula:ver', 'Ver planes e inscripciones'),
    ('matricula:crear', 'Crear planes e inscribir alumnos');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.clave IN ('matricula:ver', 'matricula:crear');

-- Secretaría inscribe (confirmado por Sergio: "secretaria para registrar
-- los datos e inscripciones"), pero no define planes/tarifas nuevos —
-- eso queda como decisión de Administración.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave = 'matricula:ver';

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave = 'matricula:crear'; -- crear inscripciones, sí; crear planes se restringe a nivel de servicio, no de permiso (ver servicio.js)

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'matricula:ver';
