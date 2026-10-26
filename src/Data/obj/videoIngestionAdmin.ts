import axios, { AxiosError } from 'axios'
import { AdminKeyError, clearAdminKey, getAdminKey } from './adminKey'
import { requestAdminKey } from './adminKeyPrompt'

/**
 * Escrituras de `/video-ingestion` con `X-Admin-Key` (migration-dashboard/011,
 * migration-backend/054), a través de la ruta del panel
 * `/api/video-ingestion/<ruta>/`.
 *
 * - Sin clave guardada, la pide (diálogo de `AdminKeyDialog`).
 * - 401: borra la clave, la vuelve a pedir y reintenta una vez. Es seguro
 *   reintentar: con 401 el backend no ha ejecutado nada (el guard va antes).
 * - 503: el backend no tiene `ADMIN_API_KEY`.
 * - Cualquier otro error se relanza tal cual, para que la pantalla siga
 *   mostrando el mensaje de siempre.
 */

export type VideoIngestionWriteMethod = 'POST' | 'PATCH'

const MISSING = 'Hace falta la clave de administración para guardar cambios en las visitas.'
const WRONG = 'Clave de administración incorrecta. Vuelve a introducirla.'

export const videoIngestionWrite = async <T = unknown>(
  method: VideoIngestionWriteMethod,
  path: string,
  body?: unknown
): Promise<T> => {
  let key = getAdminKey() || (await requestAdminKey())

  for (let attempt = 0; ; attempt++) {
    if (!key) throw new AdminKeyError('unauthorized', MISSING)
    try {
      const { data } = await axios.request<T>({
        method,
        url: `/api/video-ingestion/${path.replace(/^\/+|\/+$/g, '')}/`,
        data: body ?? {},
        headers: { 'X-Admin-Key': key }
      })

      return data
    } catch (e) {
      const status = (e as AxiosError)?.response?.status
      if (status === 401) {
        clearAdminKey()
        if (attempt === 0) {
          key = await requestAdminKey(WRONG)
          continue
        }
        throw new AdminKeyError('unauthorized', WRONG)
      }
      if (status === 503) {
        throw new AdminKeyError('not_configured', 'Administración no configurada en el servidor (ADMIN_API_KEY).')
      }
      throw e
    }
  }
}
