import type { NextApiRequest, NextApiResponse } from 'next/dist/shared/lib/utils'

import { validatePushInput } from 'src/Data/obj/push'
import { checkAdminSession } from 'src/server/adminSession'

/**
 * Envío (POST, con islas/gustos opcionales; ≤ 5 temas FCM) e historial
 * (GET ?limit=) de notificaciones push desde el
 * servidor del panel, para que la clave `X-Admin-Key` (migration-backend/054)
 * nunca llegue al navegador. Solo acepta la sesión de un administrador del
 * panel (src/server/adminSession.ts). Se configura con:
 *   PUSH_ADMIN_KEY      → la misma que PUSH_ADMIN_KEY del backend (≥ 24 caracteres)
 *   API_V2 (opcional)   → base de la API V2 (por defecto, la de producción)
 */

const API = (process.env.API_V2 || process.env.NEXT_PUBLIC_API_V2 || 'https://api.guachinchesmodernos.com:459').replace(
  /\/$/,
  ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')

    return res.status(405).end()
  }

  const session = checkAdminSession(req)
  if (!session.ok) return res.status(session.status).json({ error: session.error })

  const key = process.env.PUSH_ADMIN_KEY
  if (!key) return res.status(503).json({ error: 'push_key_missing' })

  let url: string
  let init: RequestInit
  if (req.method === 'POST') {
    const parsed = validatePushInput(req.body)
    if (!parsed.ok) return res.status(400).json({ error: 'bad_request', field: parsed.field })
    url = `${API}/v1/admin/push`
    init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify(parsed.value)
    }
  } else {
    const n = Number(req.query.limit ?? 20)
    const limit = Number.isInteger(n) ? Math.min(Math.max(n, 1), 100) : 20
    url = `${API}/v1/admin/push?limit=${limit}`
    init = { method: 'GET', headers: { 'X-Admin-Key': key } }
  }

  try {
    const upstream = await fetch(url, init)
    const retryAfter = upstream.headers.get('retry-after')
    if (retryAfter) res.setHeader('Retry-After', retryAfter)
    const text = await upstream.text()
    res.status(upstream.status)
    try {
      return text ? res.json(JSON.parse(text)) : res.end()
    } catch {
      return res.json({ error: upstream.ok ? 'bad_response' : `http_${upstream.status}` })
    }
  } catch {
    return res.status(502).json({ error: 'upstream_unreachable' })
  }
}
