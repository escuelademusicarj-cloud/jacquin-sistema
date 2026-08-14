# Jacquin — Sistema Web de Gestión Interna

## Estado: FASE 1 — Inicio de sesión + identidad (funcional para pruebas)

### Entorno — cómo levantarlo
```bash
cd backend
cp .env.example .env        # completar DATABASE_URL contra un PostgreSQL real; JWT_SECRET con cualquier string largo
npm install
npm run migrate             # crea tablas + roles + permisos semilla
npm run seed:admin          # crea el primer usuario admin (dominio genérico de prueba)
npm run dev                 # backend en http://localhost:3001
```
Probar login:
```bash
curl -X POST http://localhost:3001/api/identidad/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jacquin.local","password":"CambiarEnPrimerIngreso123"}'
```
Devuelve `{ data: { token, usuario }, error: null }`. Ese `token` va en `Authorization: Bearer <token>` para el resto de los endpoints (ej. `GET /api/identidad/roles`).

### Qué es cada fase construida hasta ahora

**Fase 0 — Core arquitectónico** (columna vertebral, sin funcionalidad de negocio):
- Arquitectura en capas: `config` → `dominio` → `servicios` → `persistencia` / `api` / `auditoria` / `notificaciones`.
- Módulo de Identidad como *patrón de referencia* (estructura de carpetas y convenciones que van a repetir los módulos de negocio de fases siguientes).
- Convención de respuesta de API (`{ data, error, meta }`), manejo de errores centralizado, migraciones versionadas.
- En esta fase los middlewares de autenticación/autorización eran esqueleto — dejaban pasar todo.

**Fase 1 — Inicio de sesión + identidad** (esta entrega, ya funcional):
- `POST /api/identidad/login`: verifica contraseña (bcrypt) y devuelve un token JWT (8h de duración).
- Middleware de autenticación real: valida el token, adjunta `req.usuario`.
- Middleware de autorización real: verifica el permiso del rol contra `permisos`/`rol_permisos`.
- Migración 002: permisos iniciales (`identidad:ver`, `identidad:crear`) asignados al rol ADMINISTRADOR.
- `npm run seed:admin`: crea el primer usuario para poder probar el flujo de punta a punta.

### Qué NO incluye todavía
- Dashboard, estudiantes, matrícula, horarios, asistencia, pagos, evaluación (fases 2-9) — ningún módulo de negocio tiene datos ni endpoints reales todavía.
- Frontend real conectado a este backend — la malla de navegación y la pantalla de login que vimos son solo referencia visual (Artifact), no están conectadas a esta API todavía.
- Políticas de seguridad avanzadas del módulo Admin (expiración de contraseña, bloqueo por intentos fallidos) — quedan para cuando se construya ese módulo específicamente.

### Asunciones vigentes (sin confirmar por Sergio)
Ver historial completo en la Skill (`base-conocimiento-proyecto.md`). Las más relevantes: catálogo de instrumentos separado del inventario físico; tutor sin login; reglas de mora y método pedagógico pendientes; dominio de email del admin es genérico de prueba, no el dominio real de la academia.

**No se avanza a Fase 2 (Dashboard) sin aprobación explícita.**
