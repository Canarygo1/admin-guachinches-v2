# admin-guachinches-v2

Panel de administración de «Dónde Comer Canarias» (Next.js 12, MUI, plantilla Materio). Se despliega en Vercel.

## Desarrollo

```bash
npm ci --legacy-peer-deps
npm run dev
```

## Variables de entorno

Se configuran en Vercel (Project → Settings → Environment Variables) y, en local, en `.env.local`.
Las claves de administración van **sin** prefijo `NEXT_PUBLIC_`: solo las leen las rutas API del
servidor (`src/pages/api/…`) y nunca llegan al navegador.

| Variable | Dónde se usa | Valor |
| --- | --- | --- |
| `NEXT_PUBLIC_API_V2` | navegador y servidor | Base de la API V2. Por defecto `https://api.guachinchesmodernos.com:459`. |
| `API_V2` | servidor (opcional) | Base de la API V2 para las rutas API, si difiere de la anterior. |
| `ENCUESTA_ADMIN_KEY` | `/api/encuesta/candidatos` | La misma que `ADMIN_API_KEY` del backend. |
| `PUSH_ADMIN_KEY` | `/api/push` (pantalla «Notificaciones») | **La misma que `PUSH_ADMIN_KEY` del backend** (mínimo 24 caracteres). Sin ella la pantalla avisa de que el envío no está configurado. |

Tras añadir o cambiar una variable en Vercel hay que volver a desplegar.

### Notificaciones push

La pantalla «Notificaciones» (`/notificaciones`) envía push por temas (`novedades`, `premios`) a
través de `/api/push/`, que añade `X-Admin-Key` desde `PUSH_ADMIN_KEY` y llama a
`POST/GET {API_V2}/v1/admin/push`. La ruta solo acepta peticiones del propio panel con la sesión
de un administrador (ver `src/server/adminSession.ts`). El backend limita a 10 envíos por hora.
