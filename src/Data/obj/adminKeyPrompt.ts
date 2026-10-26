import { setAdminKey } from './adminKey'

/**
 * Pedir la clave de administración desde código que no es un componente
 * (p. ej. una mutación de React Query). `AdminKeyDialog`, montado en `_app`,
 * registra aquí su diálogo; si no hay ninguno montado se usa `window.prompt`.
 *
 * La clave escrita se guarda con `setAdminKey` (solo `sessionStorage`).
 */

type Requester = (reason?: string) => Promise<string | null>

let requester: Requester | null = null
let pending: Promise<string | null> | null = null

export const registerAdminKeyRequester = (fn: Requester | null): void => {
  requester = fn
}

const fallback: Requester = async reason =>
  typeof window === 'undefined' ? null : window.prompt(reason || 'Clave de administración (X-Admin-Key)')

/** Varias llamadas a la vez comparten un único diálogo. */
export const requestAdminKey = (reason?: string): Promise<string | null> => {
  if (!pending) {
    pending = (requester || fallback)(reason)
      .then(value => {
        const key = value?.trim() || null
        if (key) setAdminKey(key)

        return key
      })
      .finally(() => {
        pending = null
      })
  }

  return pending
}
