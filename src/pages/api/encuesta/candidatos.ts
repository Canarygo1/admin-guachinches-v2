import type { NextApiRequest, NextApiResponse } from 'next/dist/shared/lib/utils'

/**
 * Asignar (POST) y quitar (DELETE ?id=) candidatos de la encuesta desde el
 * servidor del panel, para que la clave de administración (`X-Admin-Key`,
 * migration-backend/044) nunca llegue al navegador. Se configura con:
 *   ENCUESTA_ADMIN_KEY  → la misma que ADMIN_API_KEY del backend
 *   API_V2 (opcional)   → base de la API V2 (por defecto, la de producción)
 */

const API = (process.env.API_V2 || process.env.NEXT_PUBLIC_API_V2 || 'https://api.guachinchesmodernos.com:459').replace(
  /\/$/,
  ''
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = process.env.ENCUESTA_ADMIN_KEY
  if (!key) return res.status(503).json({ error: 'admin_key_missing' })

  let url: string
  let init: RequestInit
  if (req.method === 'POST') {
    const { survey_schema_id, category_name, restaurant_id } = req.body ?? {}
    if (!survey_schema_id || typeof category_name !== 'string' || typeof restaurant_id !== 'string') {
      return res.status(400).json({ error: 'bad_request' })
    }
    url = `${API}/category-restaurants/assign`
    init = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify({ survey_schema_id, category_name, restaurant_id })
    }
  } else if (req.method === 'DELETE') {
    const id = Number(req.query.id)
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' })
    url = `${API}/category-restaurants/${id}`
    init = { method: 'DELETE', headers: { 'X-Admin-Key': key } }
  } else {
    res.setHeader('Allow', 'POST, DELETE')

    return res.status(405).end()
  }

  try {
    const upstream = await fetch(url, init)
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
