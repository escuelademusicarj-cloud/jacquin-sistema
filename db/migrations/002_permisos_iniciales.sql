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
