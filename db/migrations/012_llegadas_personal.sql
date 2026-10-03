-- Migración 012 — Llegada del personal (control diario de hora de llegada),
-- pedido de Sergio (2026-10-03): la Secretaría registra con un solo clic la
-- hora de llegada de cada profesor (y de la propia secretaría), con
-- observaciones por día. Una fila por persona por día (UNIQUE).
--
-- hora_llegada la pone SIEMPRE el servidor (now()), nunca el navegador.
-- fecha se calcula en hora de Colombia (America/Bogota), porque Vercel
-- corre en UTC y sin ese ajuste después de las 7 p. m. quedaría el día
-- siguiente. hora_llegada puede ser NULL: un día puede tener solo
-- observación (ej. "no vino, avisó por incapacidad").

CREATE TABLE IF NOT EXISTS llegadas_personal (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha DATE NOT NULL,
    hora_llegada TIMESTAMPTZ,
    observaciones TEXT,
    registrado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT now(),
    actualizado_en TIMESTAMPTZ DEFAULT now(),
    UNIQUE (usuario_id, fecha)
);

INSERT INTO permisos (clave, descripcion) VALUES
    ('llegadas:ver', 'Ver el registro de llegada del personal y descargar reportes'),
    ('llegadas:registrar', 'Registrar/corregir llegadas y observaciones del personal')
ON CONFLICT (clave) DO NOTHING;

-- Permisos finos: ADMINISTRADOR también necesita su fila explícita
-- (no tiene bypass automático en rol_permisos).
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre IN ('ADMINISTRADOR', 'SECRETARIA') AND p.clave IN ('llegadas:ver', 'llegadas:registrar')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p
WHERE r.nombre = 'DIRECCION' AND p.clave = 'llegadas:ver'
ON CONFLICT DO NOTHING;

-- Módulo visible en el menú: SOLO para Secretaría/Dirección y SOLO si ese
-- rol ya tiene filas guardadas en permisos_modulo_rol (si no tiene
-- ninguna, usa la lista por defecto del código, que ya incluye
-- 'llegadas'; insertarle una sola fila lo dejaría viendo solo este
-- módulo). A ADMINISTRADOR nunca se le inserta nada aquí.
INSERT INTO permisos_modulo_rol (rol_id, modulo_clave)
SELECT r.id, 'llegadas' FROM roles r
WHERE r.nombre IN ('SECRETARIA', 'DIRECCION')
  AND EXISTS (SELECT 1 FROM permisos_modulo_rol x WHERE x.rol_id = r.id)
  AND NOT EXISTS (SELECT 1 FROM permisos_modulo_rol y WHERE y.rol_id = r.id AND y.modulo_clave = 'llegadas');
