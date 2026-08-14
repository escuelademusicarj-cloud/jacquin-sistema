-- Script consolidado para Supabase: pegar todo en el SQL Editor y ejecutar una sola vez.
-- Equivale a correr las migraciones 001 a 010 en orden, generado el 2026-08-14.

-- ===== migrations/001_identidad_y_auditoria.sql =====
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

-- ===== migrations/002_permisos_iniciales.sql =====
-- Migración 002 — Fase 1: permisos mínimos para poder probar el login.
-- Sin esto, el usuario admin podría autenticarse pero la autorización
-- rechazaría todo — el rol necesita permisos asignados explícitamente.

INSERT INTO permisos (clave, descripcion) VALUES
    ('identidad:ver', 'Ver usuarios y roles'),
    ('identidad:crear', 'Crear usuarios');

-- El rol ADMINISTRADOR recibe todos los permisos existentes hasta ahora.
-- A medida que se agreguen módulos (Fase 2+), sus permisos nuevos también
-- deberían asignarse acá o en su propia migración — no queda automático
-- a propósito, para que cada permiso nuevo sea una decisión explícita.
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p WHERE r.nombre = 'ADMINISTRADOR';

-- ===== migrations/003_estudiantes.sql =====
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

-- ===== migrations/004_matricula.sql =====
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

-- ===== migrations/005_pagos.sql =====
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

-- ===== migrations/006_horarios.sql =====
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

-- ===== migrations/007_asistencia.sql =====
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

-- ===== migrations/008_permisos_fila_profesor.sql =====
-- Migración 008 — Filtrado por fila para el rol PROFESOR.
-- Las migraciones 003 y 006 dejaron pendiente darle a PROFESOR el
-- permiso general de "academico:ver" y "horarios:ver" porque todavía
-- no existía filtrado por fila (hubiera visto la lista completa de
-- estudiantes/horarios, no solo los suyos). Ahora que los servicios
-- filtran por profesor_id, es seguro otorgar el permiso.

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'PROFESOR' AND p.clave = 'academico:ver'
  AND NOT EXISTS (
    SELECT 1 FROM rol_permisos rp WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'PROFESOR' AND p.clave = 'horarios:ver'
  AND NOT EXISTS (
    SELECT 1 FROM rol_permisos rp WHERE rp.rol_id = r.id AND rp.permiso_id = p.id
  );

-- ===== migrations/009_profesores.sql =====
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

-- ===== migrations/010_planes_horas_semanales.sql =====
-- Migración 010 — ajuste del modelo de Plan en Matrícula.
-- "Frecuencia semanal" (cantidad de clases) pasa a ser "horas
-- semanales" (carga horaria total) — pedido explícito del usuario.
-- El nombre del plan deja de ser un campo libre: se deriva del
-- programa + horas semanales, para no duplicar el catálogo de
-- programas con nombres inventados a mano.

ALTER TABLE planes RENAME COLUMN frecuencia_semanal TO horas_semanales;

