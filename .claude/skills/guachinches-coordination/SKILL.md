---
name: guachinches-coordination
description: Coordinación cross-repo para el proyecto Guachinches / Donde Comer Canarias. Este es el repo DASHBOARD ADMIN (Next.js 12 Pages Router + TypeScript + MUI v5 + React Query + axios + AuthContext JWT). Es un panel admin basado en el template Materio MUI. Cualquier tarea no trivial debe consultar el repo de coordinación (.claude/coordination/) antes de empezar y, al detectar impacto en backend (NestJS+PostgreSQL) o mobile (Flutter), generar archivos de migration en migration-backend/ o migration-mobile/. Nunca editar código de los otros dos repos directamente.
---

# guachinches-coordination — repo DASHBOARD (Next.js 12, admin-guachinches-v2)

Este repo es el **panel de administración** del ecosistema. Convive con:
- mobile: Flutter (`GuachinchesFlutter`)
- backend: NestJS + PostgreSQL (`guachinches-modernos-v3`)

Stack real: **Next.js 12.1.6 con Pages Router + TypeScript 4.6 + MUI 5.6 + TanStack React Query 5 + axios + AuthContext JWT manual**. Basado en el template Materio MUI React + NextJS Admin. **NO usa NextAuth ni Clerk**. **NO tiene Tailwind**.

⚠️ Existe otro repo viejo (`guachinches-react`, CRA + Redux + MUI v4/v5) que **no es el dashboard activo**. Si alguien lo menciona, redirígelo a este.

La coordinación entre los 3 repos vive en `.claude/coordination/` (symlink a `guachinches-coordination`).

## Lectura obligatoria al iniciar tarea no trivial

1. `.claude/coordination/architecture/dashboard-SKILL.md` — arquitectura real (Next.js 12 Pages Router, MUI v5, React Query, AuthContext, capa de datos en `src/Data/obj/`).
2. `.claude/coordination/shared/conventions.md` — naming, idioma, voz editorial, versionado de migrations.
3. `.claude/coordination/shared/endpoints.md` — listado canónico de endpoints HTTP. Antes de añadir una llamada axios en `src/Data/obj/<recurso>.ts`, verifica que la ruta existe (incluye un mapa de divergencias dashboard ↔ backend ya conocidas).
4. `.claude/coordination/shared/types.md` — modelos JSON compartidos.
5. `.claude/coordination/shared/database.md` — esquema PostgreSQL (consultar cuando un campo no aparece en la respuesta y necesites saber si existe en BD).
6. `.claude/coordination/migration-dashboard/` — migrations pendientes que afectan a este repo.

## Reglas de detección de impacto

### → Impacto en BACKEND (NestJS + PostgreSQL)

Dispara migration si:
- Necesitas un endpoint nuevo o un campo nuevo en la respuesta.
- Cambias la forma del payload de una llamada existente (POST/PUT/PATCH/DELETE).
- Necesitas filtros, paginación o agregaciones nuevas en una ruta.
- Añades una nueva pantalla de moderación que requiere endpoint dedicado.
- Tocas roles/permisos del login (CASL ability + AuthContext).

**Acción:**
1. `⚠️ Esta tarea requiere cambios en BACKEND.`
2. Crea `.claude/coordination/migration-backend/NNN-titulo.md` (NNN correlativo desde 001).
3. Prompt autónomo: módulo NestJS a tocar (en `src/`), DTO esperado con campos+tipos, ejemplo de payload, SQL/migration Sequelize si hay esquema nuevo. Recordar: ORM es Sequelize (`migrations/YYYYMMDDHHmmss-titulo.js`), no TypeORM/Prisma.

### → Impacto en MOBILE (Flutter)

Dispara migration si:
- El cambio expone un dato/funcionalidad que la app móvil debería consumir.
- Modificas un endpoint que la app ya usa (verificar en `shared/endpoints.md` o en `lib/data/HttpRemoteRepository.dart` del repo mobile).

**Acción:**
1. `⚠️ Esta tarea requiere cambios en MOBILE.`
2. Crea `.claude/coordination/migration-mobile/NNN-titulo.md`.
3. Prompt autónomo: archivo a tocar (`lib/data/HttpRemoteRepository.dart`, `lib/data/model/X.dart`, Cubit afectado), patrón a respetar (Cubit + Presenter+View en pantallas complejas), navegación con `GlobalMethods.pushPage`, dotenv `ENDPOINT_V1` / `ENDPOINT_V2`.

## Cierre de tarea

1. Lista las migrations creadas en este turno.
2. Recuerda al usuario:
   - Commit en este repo: cambios en `src/`, `package.json`. **No commitear `.env`** (contiene `JWT_SECRET`).
   - Commit + push del repo coordination con las migrations añadidas.
3. Si añadiste consumo de un endpoint nuevo, confirma que está listado en `shared/endpoints.md` (o que su migration-backend lo añadirá).

## Anti-patrones específicos de este repo

- ❌ **No hardcodees URLs del backend.** Hoy hay deuda histórica: 44+ URLs `https://api.guachinchesmodernos.com:459/...` y `:480/...` repartidas por `src/Data/obj/*.ts`. Si añades una llamada nueva, intenta extraer una constante (ej. en `src/configs/api.ts`) o al menos deja TODO. **Nunca repitas las dos URLs sin documentar el porqué.**
- ❌ **No introduzcas un segundo cliente HTTP.** Stack actual: axios + React Query. No añadas fetch directo, swr ni urql.
- ❌ **No metas Tailwind ni shadcn.** El sistema de estilos es MUI v5 + Emotion. Para componentes nuevos, usa `sx`, `styled()` o componentes MUI.
- ❌ **No mezcles App Router con Pages Router.** Este repo es Next.js 12 con Pages Router (`src/pages/`). Migrar a App Router es decisión de producto, no de tarea.
- ❌ **No añadas archivos sin TypeScript.** Todo el repo es `.ts` / `.tsx`.
- ❌ **No bypass-es la capa `src/Data/obj/`.** Toda llamada al backend pasa por una función ahí. Si una página llama axios directo (hay deuda en `src/pages/restaurantes/index.tsx` y similares), no la amplíes.
- ❌ **No uses NextAuth/Clerk/Auth0** sin coordinarlo. Auth actual es JWT manual con `AuthContext` (`src/context/AuthContext.tsx`) y `localStorage.accessToken` + `userData`. Endpoints: `POST /jwt/login`, `POST /jwt/register`, `GET /auth/me` — son rutas del template Materio que pueden estar **mockeadas o apuntando a otro backend distinto del NestJS principal**. Auditar antes de tocar.
- ❌ **No commitees credenciales.** Hay credenciales de test hardcoded en `src/pages/login/index.tsx` (`tjpubliccomunity@gmail.com / Teide/02`) — deuda histórica, no la amplíes.
- ❌ **No asumas cambios en la API del NestJS sin verificar `shared/endpoints.md`.** Si necesitas un endpoint que no está, abre migration-backend.
- ❌ **No edites código fuera de este repo.** Cambios en mobile o backend van por migration. El symlink `.claude/coordination/` solo sirve para escribir archivos de coordinación.

## Detalles operativos del repo

- **Rutas**: `src/pages/{login,restaurantes,encuesta,blogPost,municipality,banners,videos,...}`. Layouts en `src/layouts/` y `src/@core/layouts/`.
- **Capa de datos**: `src/Data/obj/<recurso>.ts` (`restaurant.ts`, `video.ts`, `photo.ts`, `banner.ts`, `category.ts`, `blogPost.ts`, `municipality.ts`, `survey.ts`).
- **Auth**: `src/context/AuthContext.tsx` + `src/configs/auth.ts` + `src/hooks/useAuth.tsx`. Guards: `AuthGuard`, `GuestGuard`, `AclGuard` (CASL).
- **Theme**: `src/configs/themeConfig.ts` + `src/@core/theme/*`. Emotion CSS-in-JS. Soporte dark mode + RTL.
- **Estado global**: AuthContext + SettingsContext + React Query (caching). NO Redux, NO Zustand.
- **Variables de entorno**: solo `.env` con `JWT_SECRET` y `JWT_REFRESH_TOKEN_SECRET`. **No hay `NEXT_PUBLIC_API_URL`** — pendiente de añadir.

## Recordatorio
SOLO puedes editar archivos en este repo dashboard y en `.claude/coordination/` (vía symlink). Cualquier otro cambio se documenta como migration.
