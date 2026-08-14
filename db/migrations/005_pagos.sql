-- Migración 005 — Fase 2: módulo Pagos y cartera (MVP, prioridad 3).
-- "Es una de las cosas más importantes" — cita textual de Sergio.
-- Conceptos configurables (no hardcodeados), igual criterio que planes.

CREATE TABLE conceptos_pago (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL, -- ej. "Matrícula", "Mensualidad", "Clase suelta", "Evento"
    tipo TEXT NOT NULL DEFAULT 'unico' CHECK (tipo IN ('recurrente', 'unico')),
    activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE cargos (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER REFERENCES alumnos(id) NOT NULL,
    concepto_id INTEGER REFERENCES conceptos_pago(id) NOT NULL,
    inscripcion_id INTEGER REFERENCES inscripciones(id), -- opcional: liga el cargo a una matrícula específica
    valor NUMERIC(12,2) NOT NULL,
    descuento NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_pendiente NUMERIC(12,2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'pagado', 'vencido')),
    creado_en TIMESTAMP DEFAULT now()
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    cargo_id INTEGER REFERENCES cargos(id) NOT NULL,
    valor NUMERIC(12,2) NOT NULL,
    fecha_pago DATE NOT NULL,
    medio_pago TEXT,
    creado_en TIMESTAMP DEFAULT now()
);

INSERT INTO conceptos_pago (nombre, tipo) VALUES
    ('Matrícula', 'unico'),
    ('Mensualidad', 'recurrente'),
    ('Clase suelta', 'unico'),
    ('Programa especial', 'unico'),
    ('Evento', 'unico');

INSERT INTO permisos (clave, descripcion) VALUES
    ('pagos:ver', 'Ver cargos, pagos y cartera'),
    ('pagos:crear', 'Registrar cargos y pagos');

-- Manejo financiero acotado a Administración (confirmado por Sergio:
-- "Administración debería manejar prácticamente todo... pagos").
-- Secretaría y Dirección consultan cartera pero no registran pagos —
-- ASUNCIÓN a confirmar (ver preguntas pendientes para Sergio).
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'ADMINISTRADOR' AND p.clave IN ('pagos:ver', 'pagos:crear');

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'pagos:ver';

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'SECRETARIA' AND p.clave = 'pagos:ver';
