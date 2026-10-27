import axios, { AxiosError } from "axios";
import authConfig from "src/configs/auth";

/**
 * Notificaciones push a los usuarios de la app, por temas (migration-backend/054).
 *
 * El backend exige `X-Admin-Key` (PUSH_ADMIN_KEY). La clave no llega al
 * navegador: estas llamadas van a la ruta del propio panel `/api/push/`, que la
 * añade en el servidor y que solo acepta la sesión de un administrador (ver
 * src/server/adminSession.ts).
 */

// ── Reglas (las mismas que el backend; se usan en el formulario y en /api/push) ─

export const PUSH_TOPICS = [
  { key: "novedades", label: "Nuevas visitas y listas" },
  { key: "premios", label: "Premios" },
] as const;
export type PushTopic = (typeof PUSH_TOPICS)[number]["key"];

export const PUSH_ROUTES = [
  { key: "premios", label: "Premios" },
  { key: "premios_ranking", label: "Ranking de Premios" },
  { key: "premios_vote", label: "Votar en Premios" },
] as const;
export type PushRoute = (typeof PUSH_ROUTES)[number]["key"];

/** Islas (temas `isla_<slug>`), igual que el backend. */
export const PUSH_ISLANDS = [
  { slug: "tenerife", name: "Tenerife" },
  { slug: "gran_canaria", name: "Gran Canaria" },
  { slug: "lanzarote", name: "Lanzarote" },
  { slug: "fuerteventura", name: "Fuerteventura" },
  { slug: "la_palma", name: "La Palma" },
  { slug: "la_gomera", name: "La Gomera" },
  { slug: "el_hierro", name: "El Hierro" },
] as const;
const ISLAND_SLUGS: readonly string[] = PUSH_ISLANDS.map((i) => i.slug);

/** FCM admite como máximo 5 temas por condición (base + islas + gustos). */
export const PUSH_MAX_TOPICS = 5;
export const PUSH_SLUG_RE = /^[a-z0-9_]{1,64}$/;
export const pushTopicCount = (islands: readonly unknown[] = [], categories: readonly unknown[] = []) =>
  1 + islands.length + categories.length;

export const PUSH_TITLE_MAX = 65;
export const PUSH_BODY_MAX = 180;
export const PUSH_LINK_MAX = 500;

const LINK_HOSTS = new Set([
  "guachinchesmodernos.com",
  "www.guachinchesmodernos.com",
  "dondecomercanarias.com",
  "www.dondecomercanarias.com",
]);

/** https de guachinchesmodernos.com / dondecomercanarias.com (con o sin www) o `dondecomercanarias://…`. */
export const isValidPushLink = (link: string): boolean => {
  if (!link || link.length > PUSH_LINK_MAX || /\s/.test(link)) return false;
  if (/^dondecomercanarias:\/\/.+/.test(link)) return true;
  try {
    const u = new URL(link);

    return u.protocol === "https:" && LINK_HOSTS.has(u.hostname.toLowerCase()) && !u.username && !u.password && !u.port;
  } catch {
    return false;
  }
};

export interface PushInput {
  topic: PushTopic;
  title: string;
  body: string;
  link?: string;
  route?: PushRoute;
  dryRun?: boolean;

  /** Slugs de isla; ausente = todas. */
  islands?: string[];

  /** Slugs de gusto (categorías); ausente = todos. */
  categories?: string[];
}

/** Valida y normaliza. Devuelve el payload limpio o el nombre del primer campo inválido. */
export const validatePushInput = (raw: any): { ok: true; value: PushInput } | { ok: false; field: string } => {
  const r = raw ?? {};
  if (!PUSH_TOPICS.some((t) => t.key === r.topic)) return { ok: false, field: "topic" };
  const title = typeof r.title === "string" ? r.title.trim() : "";
  if (!title || title.length > PUSH_TITLE_MAX) return { ok: false, field: "title" };
  const body = typeof r.body === "string" ? r.body.trim() : "";
  if (!body || body.length > PUSH_BODY_MAX) return { ok: false, field: "body" };
  const value: PushInput = { topic: r.topic, title, body };
  if (r.link !== undefined && r.link !== null && r.link !== "") {
    if (typeof r.link !== "string" || !isValidPushLink(r.link.trim())) return { ok: false, field: "link" };
    value.link = r.link.trim();
  }
  if (r.route !== undefined && r.route !== null && r.route !== "") {
    if (!PUSH_ROUTES.some((x) => x.key === r.route)) return { ok: false, field: "route" };
    value.route = r.route;
  }
  if (r.dryRun !== undefined && typeof r.dryRun !== "boolean") return { ok: false, field: "dryRun" };
  if (r.dryRun) value.dryRun = true;
  const slugs = (v: unknown): string[] | null => {
    if (v === undefined || v === null) return [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !PUSH_SLUG_RE.test(x))) return null;

    return Array.from(new Set(v as string[]));
  };
  const islands = slugs(r.islands);
  if (!islands || islands.some((i) => !ISLAND_SLUGS.includes(i))) return { ok: false, field: "islands" };
  const categories = slugs(r.categories);
  if (!categories) return { ok: false, field: "categories" };
  if (pushTopicCount(islands, categories) > PUSH_MAX_TOPICS) return { ok: false, field: "topics" };
  if (islands.length) value.islands = islands;
  if (categories.length) value.categories = categories;

  return { ok: true, value };
};

// ── Destinos que construye el formulario ─────────────────────────────────

const WEB = "https://guachinchesmodernos.com";

/** Igual que `slugify(titleCase(nombre))` de la web (lib/api/adapters.ts). */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const linkFicha = (r: { id: string; nombre: string }) => `${WEB}/restaurante/${slugify(r.nombre) || "sitio"}/?r=${r.id}`;
export const linkVotar = (id: string) => `${WEB}/premios/votar/${id}/`;
export const linkLista = (id: string) => `${WEB}/listas/${encodeURIComponent(id)}/`;

// ── Llamadas (a través del servidor del panel) ───────────────────────────

export interface PushSent {
  messageId: string | null;
  dryRun: boolean;
  condition?: string | null;
}

export interface PushLogEntry {
  id: number | string;
  topic: string;
  title: string;
  body: string;
  link: string | null;
  route: string | null;
  dry_run: boolean;
  message_id: string | null;
  created_at: string;
  islands: string[];
  categories: string[];
}

/** El backend responde en camelCase (dryRun, createdAt…); aceptamos ambas formas. */
const toLogEntry = (r: any): PushLogEntry => ({
  id: r.id,
  topic: r.topic,
  title: r.title,
  body: r.body,
  link: r.link ?? null,
  route: r.route ?? null,
  dry_run: !!(r.dryRun ?? r.dry_run),
  message_id: r.messageId ?? r.message_id ?? null,
  created_at: r.createdAt ?? r.created_at,
  islands: Array.isArray(r.islands) ? r.islands : [],
  categories: Array.isArray(r.categories) ? r.categories : [],
});

export interface PushOption {
  slug: string;
  name: string;
}

export interface PushWeekly {
  used: number;
  limit: number;
  nextAllowedAt: string | null;
}

export interface PushOptions {
  islands: PushOption[];
  categories: PushOption[];
  weekly: Partial<Record<PushTopic, PushWeekly>>;
}

export type PushErrorKind =
  | "session"
  | "panel_not_configured"
  | "backend_not_configured"
  | "bad_key"
  | "rate_limited"
  | "weekly_limit"
  | "bad_request"
  | "unreachable"
  | "other";

export class PushError extends Error {
  constructor(public kind: PushErrorKind, message: string) {
    super(message);
  }
}

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== "undefined" ? window.localStorage.getItem(authConfig.storageTokenKeyName) : null;

  return token ? { Authorization: token } : {};
};

const FIELD: Record<string, string> = {
  topic: "el tema",
  title: `el título (1–${PUSH_TITLE_MAX} caracteres)`,
  body: `el texto (1–${PUSH_BODY_MAX} caracteres)`,
  link: "el enlace (solo guachinchesmodernos.com, dondecomercanarias.com o dondecomercanarias://)",
  route: "la pantalla de destino",
  dryRun: "el modo prueba",
  islands: "las islas",
  categories: "los gustos",
  topics: `la audiencia: como mucho ${PUSH_MAX_TOPICS - 1} islas y gustos en total`,
};

const fechaCorta = (iso?: string | null) => {
  const d = iso ? new Date(iso) : null;

  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;
};

const asPushError = (e: unknown): PushError => {
  const res = (e as AxiosError<{ error?: string; field?: string; message?: string | string[] }>)?.response;
  if (!res) return new PushError("unreachable", "No se pudo contactar con el panel. Revisa la conexión.");
  const code = res.data?.error ?? "";
  if (code.startsWith("session_")) {
    return new PushError("session", "Tu sesión del panel no es válida. Cierra sesión y vuelve a entrar.");
  }
  if (code === "push_key_missing") {
    return new PushError("panel_not_configured", "El panel no tiene configurada la clave de envío (PUSH_ADMIN_KEY en Vercel).");
  }
  if (res.status === 503) {
    return new PushError(
      "backend_not_configured",
      code === "admin_disabled"
        ? "El backend no tiene configurada PUSH_ADMIN_KEY (o es demasiado corta)."
        : "El envío de notificaciones no está configurado en el backend (Firebase)."
    );
  }
  if (res.status === 401 || res.status === 403) {
    return new PushError("bad_key", "El backend rechaza la clave: PUSH_ADMIN_KEY del panel y del backend no coinciden.");
  }
  if (res.status === 429 && code === "weekly_limit") {
    const d = res.data as { topic?: string; limit?: number; nextAllowedAt?: string };
    const label = PUSH_TOPICS.find((t) => t.key === d.topic)?.label ?? d.topic ?? "este tema";
    const when = fechaCorta(d.nextAllowedAt);

    return new PushError(
      "weekly_limit",
      `Límite semanal alcanzado: como mucho ${d.limit ?? "—"} envíos por semana a «${label}».${when ? ` El siguiente se podrá enviar el ${when}.` : ""}`
    );
  }
  if (res.status === 429) {
    const retry = Number(res.headers?.["retry-after"]);
    const when = Number.isFinite(retry) && retry > 0 ? ` Vuelve a intentarlo en ${Math.ceil(retry / 60)} min.` : " Vuelve a intentarlo más tarde.";

    return new PushError("rate_limited", `Límite alcanzado: como mucho 10 envíos por hora.${when}`);
  }
  if (res.status === 400) {
    const f = res.data?.field;
    const msg = Array.isArray(res.data?.message) ? res.data?.message.join(", ") : res.data?.message;
    if (code === "too_many_topics") return new PushError("bad_request", `Revisa ${FIELD.topics}.`);
    if (code === "invalid_island") return new PushError("bad_request", "Alguna isla no es válida.");
    if (code === "invalid_category") {
      const bad = (res.data as { invalid?: string[] })?.invalid;

      return new PushError("bad_request", `Algún gusto ya no existe${bad?.length ? `: ${bad.join(", ")}` : ""}. Recarga la página.`);
    }

    return new PushError("bad_request", f && FIELD[f] ? `Revisa ${FIELD[f]}.` : `Datos no válidos${msg ? `: ${msg}` : "."}`);
  }
  if (res.status === 502 || res.status === 504) return new PushError("unreachable", "El backend no responde. Inténtalo de nuevo.");

  return new PushError("other", `No se pudo completar la operación (HTTP ${res.status}).`);
};

export const sendPush = async (input: PushInput): Promise<PushSent> => {
  try {
    const { data } = await axios.post("/api/push/", input, { headers: authHeaders() });

    return data;
  } catch (e) {
    throw asPushError(e);
  }
};

export const getPushHistory = async (limit = 20): Promise<PushLogEntry[]> => {
  try {
    const { data } = await axios.get("/api/push/", { params: { limit }, headers: authHeaders() });

    return Array.isArray(data) ? data.map(toLogEntry) : [];
  } catch (e) {
    throw asPushError(e);
  }
};

export const getPushOptions = async (): Promise<PushOptions> => {
  try {
    const { data } = await axios.get("/api/push/options", { headers: authHeaders() });

    return {
      islands: Array.isArray(data?.islands) ? data.islands : [],
      categories: Array.isArray(data?.categories) ? data.categories : [],
      weekly: data?.weekly ?? {},
    };
  } catch (e) {
    throw asPushError(e);
  }
};

/** «Lo recibirán: quienes tengan activadas las novedades, en Tenerife, que les gusten los guachinches». */
export const audienceText = (
  topic: PushTopic,
  islands: readonly string[],
  categories: readonly string[],
  names: { islands?: PushOption[]; categories?: PushOption[] } = {}
): string => {
  const nameOf = (list: readonly PushOption[] | undefined, slug: string) => list?.find((o) => o.slug === slug)?.name ?? slug;
  const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} o ${xs[xs.length - 1]}`);
  const base = topic === "premios" ? "los avisos de Premios" : "las novedades";
  const parts = [`quienes tengan activad${topic === "premios" ? "os" : "as"} ${base}`];
  parts.push(
    islands.length ? `en ${join(islands.map((s) => nameOf(names.islands ?? (PUSH_ISLANDS as unknown as PushOption[]), s)))}` : "en todas las islas"
  );
  if (categories.length) parts.push(`que les guste ${join(categories.map((s) => `«${nameOf(names.categories, s)}»`))}`);

  return `Lo recibirán: ${parts.join(", ")}`;
};

// ── Listas curadas (selector de destino) ─────────────────────────────────

export interface CuratedListOption {
  id: string;
  title: string;
  eyebrow?: string;
  location?: string;
}

export const getCuratedLists = async (apiBase: string): Promise<CuratedListOption[]> => {
  const { data } = await axios.get(`${apiBase}/curated-lists`);

  return (Array.isArray(data) ? data : []).map((l: any) => ({ id: l.id, title: l.title, eyebrow: l.eyebrow, location: l.location }));
};
