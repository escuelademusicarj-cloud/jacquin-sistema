-- Migración 013 — "No asistió" en Llegada del personal (pedido de Sergio,
-- 2026-10-03). Se puede correr antes o después de la 012 ya aplicada: si
-- la columna ya existe no hace nada. Un día con no_asistio = true nunca
-- tiene hora_llegada (son excluyentes; el backend lo controla).
ALTER TABLE llegadas_personal ADD COLUMN IF NOT EXISTS no_asistio BOOLEAN NOT NULL DEFAULT false;
