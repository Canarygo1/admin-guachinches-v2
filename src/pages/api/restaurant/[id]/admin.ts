import type { NextApiRequest, NextApiResponse } from 'next/dist/shared/lib/utils'

/**
 * Datos de cobro de un restaurante (migration-dashboard/010): reenvía
 * `GET /restaurant/:id/admin` de la API V2 con la cabecera `X-Admin-Key`.
 *
 * A diferencia de `/api/encuesta/candidatos`, aquí NO se usa una clave del
 * servidor (`ENCUESTA_ADMIN_KEY`): el panel no tiene sesión en el servidor, así
 * que esta ruta quedaría abierta a cualquiera y volvería a publicar justo los
 * campos que el backend ha dejado de exponer. La clave la escribe el
 * administrador, vive en su `sessionStorage` y llega aquí en la cabecera.
 *
 *   API_V2 (opcional) → base de la API V2 (por defecto, la de producción)
 */

const API = (process.env.API_V2 || process.env.NEXT_PUBLIC_API_V2 || 'https://api.guachinchesmodernos.com:459').replace(
  /\/$/,
  ''
)

/** Lo único que se devuelve al navegador (nunca la contraseña ni el resto de la fila). */
const FIELDS = ['id', 'ultimoPago', 'proximoPago', 'pagoId', 'movilPago', 'restaurantTypeId', 'restaurantType'] as const

const ID_RE = /^[A-Za-z0-9-]{1,64}$/

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')

    return res.status(405).end()
  }

  const id = req.query.id
  if (typeof id !== 'string' || !ID_RE.test(id)) return res.status(400).json({ error: 'bad_request' })

  const raw = req.headers['x-admin-key']
  const key = Array.isArray(raw) ? raw[0] : raw
  if (!key) return res.status(401).json({ error: 'admin_key_required' })

  try {
    const upstream = await fetch(`${API}/restaurant/${id}/admin`, { headers: { 'X-Admin-Key': key } })
    const text = await upstream.text()
    let body: any = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = null
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: body?.error || `http_${upstream.status}` })
    }
    if (!body || typeof body !== 'object') return res.status(502).json({ error: 'bad_response' })

    const out: Record<string, unknown> = {}
    for (const f of FIELDS) if (f in body) out[f] = body[f]

    return res.status(200).json(out)
  } catch {
    return res.status(502).json({ error: 'upstream_unreachable' })
  }
}
