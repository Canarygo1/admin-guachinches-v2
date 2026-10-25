import jwt from 'jsonwebtoken'
import type { NextApiRequest } from 'next/dist/shared/lib/utils'

import { jwtConfig, users } from 'src/@fake-db/auth/users'

/**
 * Comprobación de sesión de administrador para las rutas API del panel.
 *
 * El panel no tiene login de servidor: el login de la plantilla Materio se
 * resuelve en el navegador (axios-mock-adapter, src/@fake-db/auth/jwt.ts) y
 * deja un JWT HS256 en `localStorage.accessToken`. Esta función exige ese
 * token en `Authorization`, lo verifica con el mismo secreto y comprueba que
 * pertenece a un usuario con rol `admin`. Además rechaza peticiones de otro
 * origen (cabeceras `Sec-Fetch-Site` / `Origin`), para que otra web no pueda
 * usar la ruta desde el navegador de un admin.
 *
 * LIMITACIÓN: el secreto viaja en el bundle del cliente, así que quien lo
 * extraiga puede fabricar un token. Esto frena llamadas anónimas (curl sin
 * token, bots, CSRF) pero no es una frontera de seguridad real; la clave de
 * administración del backend sigue sin salir del servidor. Sustituir por una
 * sesión de servidor cuando exista login real (migration-backend/022).
 */

export type AdminSessionResult = { ok: true; userId: number } | { ok: false; status: 401 | 403; error: string }

const header = (req: NextApiRequest, name: string): string | undefined => {
  const v = req.headers[name]

  return Array.isArray(v) ? v[0] : v
}

export function checkAdminSession(req: NextApiRequest): AdminSessionResult {
  const site = header(req, 'sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return { ok: false, status: 403, error: 'session_cross_site' }

  const origin = header(req, 'origin')
  if (origin) {
    let host: string | null = null
    try {
      host = new URL(origin).host
    } catch {
      host = null
    }
    const expected = header(req, 'x-forwarded-host') ?? header(req, 'host')
    if (!host || host !== expected) return { ok: false, status: 403, error: 'session_cross_site' }
  }

  const raw = (header(req, 'authorization') ?? '').trim()
  const token = raw.replace(/^Bearer\s+/i, '')
  if (!token) return { ok: false, status: 401, error: 'session_missing' }

  let payload: unknown
  try {
    payload = jwt.verify(token, jwtConfig.secret, { algorithms: ['HS256'] })
  } catch {
    return { ok: false, status: 401, error: 'session_invalid' }
  }

  const id = typeof payload === 'object' && payload !== null ? (payload as { id?: unknown }).id : undefined
  const user = users.find(u => u.id === id)
  if (!user || user.role !== 'admin') return { ok: false, status: 403, error: 'session_forbidden' }

  return { ok: true, userId: user.id }
}
