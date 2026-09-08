-- Migración 011 — Horario semanal de profesores (planeación docente),
-- pedido explícito de Sergio (2026-09-08): dentro del módulo Profesores,
-- una grilla igual a la de Horarios de estudiantes (mismas franjas:
-- lunes a viernes 3-6pm, sábado 9-12m), donde se asigna qué profesor
-- dicta qué curso/instrumento en cada franja — independiente de
-- "clases" (que ya vincula profesor+alumnos+horario puntual). Esto es
-- de más alto nivel: no necesita alumnos todavía, y a propósito permite
-- varios profesores distintos en la misma franja, sin límite.
--
-- Un mismo profesor SÍ está limitado a una sola fila por franja (no
-- puede estar dictando dos cursos a la misma hora) — de ahí el UNIQUE.

CREATE TABLE horario_profesores (
    id SERIAL PRIMARY KEY,
    profesor_id INTEGER REFERENCES usuarios(id) NOT NULL,
    programa TEXT NOT NULL, -- instrumento/curso que dicta en esta franja — puede diferir del que tiene por defecto en su perfil (pedido explícito: "permíteme poner los profesores a dar otro instrumento")
    dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- mismo criterio que "clases": 0 = domingo
    hora_inicio TIME NOT NULL,
    creado_en TIMESTAMP DEFAULT now(),
    UNIQUE (profesor_id, dia_semana, hora_inicio)
);

INSERT INTO permisos (clave, descripcion) VALUES
    ('horarioprofesores:ver', 'Ver el horario semanal de profesores'),
    ('horarioprofesores:crear', 'Asignar y quitar profesores del horario semanal');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.clave IN ('horarioprofesores:ver', 'horarioprofesores:crear');

-- Secretaría maneja "todo lo relacionado a estudiantes" (confirmado por
-- Sergio, 2026-09-08), lo cual incluye armar el horario de profesores.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave IN ('horarioprofesores:ver', 'horarioprofesores:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'horarioprofesores:ver';
