/**
 * Clave de administración (`X-Admin-Key`, migration-backend/044 y 048).
 *
 * La introduce el administrador en tiempo de ejecución y se guarda solo en
 * `sessionStorage` (se borra al cerrar la pestaña). Nunca va en el bundle ni en
 * variables `NEXT_PUBLIC_*` (migration-dashboard/009 y 010).
 */

const STORAGE_KEY = "gm.adminKey";

export const getAdminKey = (): string | null => {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAdminKey = (key: string): void => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Sin sessionStorage (modo privado estricto): la clave solo vive en memoria.
  }
};

export const clearAdminKey = (): void => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que borrar
  }
};

export class AdminKeyError extends Error {
  constructor(public kind: "unauthorized" | "not_configured" | "other", message: string) {
    super(message);
  }
}
