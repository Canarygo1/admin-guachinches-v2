import type { NextApiRequest, NextApiResponse } from 'next/dist/shared/lib/utils'

/**
 * Escrituras de visitas (migration-dashboard/011, migration-backend/054):
 * reenvía a la API V2 las acciones de revisión de `/video-ingestion` con la
 * cabecera `X-Admin-Key` que manda el navegador.
 *
 * Igual que `/api/restaurant/[id]/admin` (010): NO hay clave del servidor. La
 * escribe el administrador, vive en su `sessionStorage` y llega aquí en la
 * cabecera; sin ella esta ruta responde 401 y no llama a la API.
 *
 * Solo pasan las rutas que usa el panel (lista blanca). El pipeline de ingesta
 * (sync, extract-all, process…) se lanza desde el backend local con curl
 * (migration-backend/037 y el runbook), no desde aquí: tarda minutos.
 *
 *   API_V2 (opcional) → base de la API V2 (por defecto, la de producción)
 */

const API = (process.env.API_V2 || process.env.NEXT_PUBLIC_API_V2 || 'https://api.guachinchesmodernos.com:459').replace(
  /\/$/,
  ''
)

const ID = '[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}'

/** Método → rutas permitidas (relativas a `/video-ingestion/`). */
const ALLOWED: Record<string, RegExp[]> = {
  PATCH: [new RegExp(`^restaurant-videos/${ID}$`)],
  POST: [new RegExp(`^restaurant-videos/${ID}/(match|mark-new|unmatch|publish|reject)$`)]
}

export const config = { maxDuration: 60 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  const method = (req.method || '').toUpperCase()
  const rules = ALLOWED[method]
  if (!rules) {
    res.setHeader('Allow', Object.keys(ALLOWED).join(', '))

    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path]
  const path = segments.filter(Boolean).join('/')
  if (!rules.some(re => re.test(path))) return res.status(404).json({ error: 'not_found' })

  const raw = req.headers['x-admin-key']
  const key = Array.isArray(raw) ? raw[0] : raw
  if (!key) return res.status(401).json({ error: 'admin_key_required' })

  try {
    const upstream = await fetch(`${API}/video-ingestion/${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify(req.body ?? {})
    })
    const text = await upstream.text()
    let body: any = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = null
    }

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: body?.error || `http_${upstream.status}`, message: body?.message ?? null })
    }

    return res.status(upstream.status).json(body)
  } catch {
    return res.status(502).json({ error: 'upstream_unreachable' })
  }
}
