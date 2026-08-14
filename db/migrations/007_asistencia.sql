-- Migración 007 — Fase 2: módulo Asistencia (MVP, prioridad 5, último del MVP).
-- Registra asistencia por clase + alumno + fecha puntual (no sobre la
-- clase recurrente en sí, sobre cada ocurrencia real).

CREATE TABLE asistencias (
    id SERIAL PRIMARY KEY,
    clase_id INTEGER REFERENCES clases(id) NOT NULL,
    alumno_id INTEGER REFERENCES alumnos(id) NOT NULL,
    fecha DATE NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('asistio', 'falta', 'excusa', 'cancelada', 'reprogramada', 'recuperada')),
    observaciones TEXT,
    registrado_por INTEGER REFERENCES usuarios(id), -- profesor que la tomó, o admin si la corrigió
    creado_en TIMESTAMP DEFAULT now(),
    UNIQUE (clase_id, alumno_id, fecha) -- una sola asistencia por alumno/clase/fecha, se corrige, no se duplica
);

INSERT INTO permisos (clave, descripcion) VALUES
    ('asistencia:ver', 'Ver asistencia'),
    ('asistencia:crear', 'Registrar y corregir asistencia');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.clave IN ('asistencia:ver', 'asistencia:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave = 'asistencia:ver';

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'asistencia:ver';

-- Profesor: "la registra el profesor al finalizar la clase" — confirmado
-- por Sergio. A diferencia de otros módulos, acá SÍ le damos el permiso
-- general (no solo lectura), porque tomar asistencia es su tarea diaria
-- explícita, aunque el alcance a "solo sus clases" siga pendiente de
-- filtrado por fila (mismo caso abierto que en Estudiantes/Horarios).
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'PROFESOR' AND p.clave IN ('asistencia:ver', 'asistencia:crear');
