import type { NextApiRequest, NextApiResponse } from 'next/dist/shared/lib/utils'

import { checkAdminSession } from 'src/server/adminSession'

/**
 * Opciones del formulario de push (GET): islas, gustos y cupo semanal por
 * tema, desde `GET /v1/admin/push/options` del backend. Misma protección que
 * /api/push: sesión de administrador del panel y `X-Admin-Key` añadida aquí.
 */

const API = (process.env.API_V2 || process.env.NEXT_PUBLIC_API_V2 || 'https://api.guachinchesmodernos.com:459').replace(
  /\/$/,
  ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')

    return res.status(405).end()
  }

  const session = checkAdminSession(req)
  if (!session.ok) return res.status(session.status).json({ error: session.error })

  const key = process.env.PUSH_ADMIN_KEY
  if (!key) return res.status(503).json({ error: 'push_key_missing' })

  try {
    const upstream = await fetch(`${API}/v1/admin/push/options`, { headers: { 'X-Admin-Key': key } })
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
