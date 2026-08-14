-- Migración 010 — ajuste del modelo de Plan en Matrícula.
-- "Frecuencia semanal" (cantidad de clases) pasa a ser "horas
-- semanales" (carga horaria total) — pedido explícito del usuario.
-- El nombre del plan deja de ser un campo libre: se deriva del
-- programa + horas semanales, para no duplicar el catálogo de
-- programas con nombres inventados a mano.

ALTER TABLE planes RENAME COLUMN frecuencia_semanal TO horas_semanales;
