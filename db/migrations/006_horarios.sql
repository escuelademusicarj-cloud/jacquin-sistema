-- Migración 006 — Fase 2: módulo Horarios (MVP, prioridad 4).
-- Confirmado por Sergio: el profesor se asigna al horario/slot
-- independientemente de qué alumnos finalmente asistan — por eso
-- "clases" es la plantilla recurrente y "clase_alumnos" es aparte.

CREATE TABLE salas (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE clases (
    id SERIAL PRIMARY KEY,
    profesor_id INTEGER REFERENCES usuarios(id) NOT NULL,
    sala_id INTEGER REFERENCES salas(id),
    programa TEXT NOT NULL, -- debe coincidir con PROGRAMAS_OFICIALES
    tipo TEXT NOT NULL DEFAULT 'individual' CHECK (tipo IN ('individual', 'grupal')),
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0 = domingo
    hora_inicio TIME NOT NULL,
    duracion_minutos INTEGER NOT NULL DEFAULT 45,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
    creado_en TIMESTAMP DEFAULT now()
);

-- Un alumno puede estar en varias clases (individual = 1 fila; grupal = N alumnos por clase).
CREATE TABLE clase_alumnos (
    clase_id INTEGER REFERENCES clases(id) ON DELETE CASCADE,
    alumno_id INTEGER REFERENCES alumnos(id) ON DELETE CASCADE,
    PRIMARY KEY (clase_id, alumno_id)
);

-- Cambios puntuales sobre una fecha específica: cancelación, reprogramación
-- o recuperación — nunca se borra la clase recurrente, se registra el evento.
CREATE TABLE clase_modificaciones (
    id SERIAL PRIMARY KEY,
    clase_id INTEGER REFERENCES clases(id) NOT NULL,
    alumno_id INTEGER REFERENCES alumnos(id), -- null = afecta a toda la clase (ej. grupal cancelada)
    tipo TEXT NOT NULL CHECK (tipo IN ('cancelada', 'reprogramada', 'recuperada')),
    fecha_original DATE NOT NULL,
    fecha_nueva DATE, -- solo aplica si tipo = 'reprogramada' o 'recuperada'
    motivo TEXT,
    creado_en TIMESTAMP DEFAULT now()
);

INSERT INTO permisos (clave, descripcion) VALUES
    ('horarios:ver', 'Ver horarios y calendario'),
    ('horarios:crear', 'Crear y modificar horarios');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.clave IN ('horarios:ver', 'horarios:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave IN ('horarios:ver', 'horarios:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'horarios:ver';

-- Profesor: ver su propio horario es parte de su rol (confirmado por
-- Sergio), pero el filtrado a "sus" clases es por fila, no por permiso
-- binario — mismo caso pendiente que en Estudiantes. No se le asigna
-- el permiso general todavía para no exponer el horario completo.
