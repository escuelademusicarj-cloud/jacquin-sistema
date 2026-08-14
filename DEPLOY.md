# Publicar Jacquin — Supabase + Vercel

Dos partes: la base de datos (Supabase) y el sitio + API (Vercel). Se hace una sola vez; después, cada `git push` actualiza el sitio solo.

## Parte 1 — Base de datos en Supabase (5 minutos)

1. Entrá a **supabase.com** → "New project". Elegí un nombre (ej. `jacquin`), una contraseña para la base (guardala, la vas a necesitar) y una región cercana.
2. Cuando el proyecto esté listo, andá a **SQL Editor** (menú izquierdo) → "New query".
3. Abrí el archivo `db/migracion-completa-supabase.sql` de este proyecto, copiá todo el contenido, pegalo en el editor y apretá **Run**. Esto crea todas las tablas, roles y permisos de una sola vez.
4. Andá a **Project Settings → Database → Connection string → URI**. Copiá esa URL — es tu `DATABASE_URL`. Reemplazá `[YOUR-PASSWORD]` por la contraseña que pusiste en el paso 1.

## Parte 2 — Backend + frontend en Vercel (5 minutos)

1. Subí esta carpeta completa a un repositorio de GitHub (si no sabés cómo, avisame y te guío con eso también).
2. Entrá a **vercel.com** → "Add New... → Project" → importá ese repositorio.
3. Antes de hacer deploy, andá a **Environment Variables** y agregá:
   - `DATABASE_URL` → la que copiaste de Supabase en el paso anterior.
   - `DATABASE_SSL` → `true`
   - `JWT_SECRET` → cualquier texto largo y aleatorio (ej. generalo en https://generate-secret.vercel.app/32).
4. Apretá **Deploy**. En 1-2 minutos vas a tener una URL pública (algo como `jacquin-sistema.vercel.app`).

## Parte 3 — Crear el primer usuario admin

Como el script `seed:admin` corre desde tu computadora (no desde Vercel), hacelo una vez desde acá:

```bash
cd backend
cp .env.example .env   # completar DATABASE_URL con la de Supabase (con DATABASE_SSL=true)
npm install
npm run seed:admin
```

Esto crea `admin@jacquin.local` / `CambiarEnPrimerIngreso123` directo en la base de Supabase — ya lo podés usar contra la URL pública de Vercel.

## Verificar que quedó bien

Abrí `https://tu-proyecto.vercel.app/api/salud` en el navegador — debería devolver `{"data":{"estado":"ok",...}}`. Eso confirma que el backend real está funcionando en producción.

## Importante — dónde estamos parados

El HTML público (`https://tu-proyecto.vercel.app/`) **todavía funciona con datos guardados en el navegador (localStorage)**, no está conectado a este backend real todavía. Vamos a conectarlos módulo por módulo en los próximos pasos, tal como lo charlamos — "publicar ya y corregir en el camino". Cuando eso pase, vas a necesitar loguearte con un usuario real (como el admin que acabás de crear) en vez de los datos de prueba del navegador.

## Actualizar el sitio después de este primer deploy

Cualquier cambio que yo haga de acá en adelante te lo voy a seguir entregando como archivos — solo tenés que reemplazarlos en tu repositorio de GitHub y hacer `git push`. Vercel vuelve a publicar solo, sin que tengas que repetir ninguno de estos pasos.
