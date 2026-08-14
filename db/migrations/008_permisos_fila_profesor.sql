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
