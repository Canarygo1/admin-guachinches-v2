import axios, { AxiosError } from "axios";

/** API V2 (encuesta, candidatos, catálogo). Configurable para probar en local. */
export const API_V2 = (process.env.NEXT_PUBLIC_API_V2 || "https://api.guachinchesmodernos.com:459").replace(/\/$/, "");

/** Categorías de los Premios, en el orden de la app. */
export const SURVEY_CATEGORIES = [
  { key: "Mejor-Guachinche-Tradicional", short: "Tradicional", title: "Mejor guachinche tradicional", color: "#7A1E2C", soft: "#F3DCDF" },
  { key: "Mejor-Guachinche-Moderno", short: "Moderno", title: "Mejor guachinche moderno", color: "#7A5A20", soft: "#F1E7D2" },
  { key: "Mejor-Restaurante", short: "Restaurante", title: "Mejor restaurante", color: "#5A5248", soft: "#EDE6DC" },
  { key: "Mejor-Bocadillo", short: "Bocadillo", title: "Mejor bocadillo", color: "#8A5A3A", soft: "#F3E6D6" },
] as const;

export type SurveyCategoryKey = (typeof SURVEY_CATEGORIES)[number]["key"];

/** Nombres de las categorías (selector de «Resultados encuesta» y alta de restaurante). */
export const surveyOptions: string[] = SURVEY_CATEGORIES.map((c) => c.key);

// ── Edición en curso (GET /surveys/v3/editions/current) ──────────────────

export interface SurveyEdition {
  editionId: number;
  label: string;
  status: "upcoming" | "open" | "closed";
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  voteScope: string | null;
  categories: string[];
}

export const getCurrentEdition = async (): Promise<SurveyEdition> => {
  const { data } = await axios.get(`${API_V2}/surveys/v3/editions/current`);
  return data;
};

// ── Candidatos (/category-restaurants) ───────────────────────────────────

export interface SurveyCandidate {

  /** Id de la asignación (para quitarla). */
  id: number;
  restaurant_id: string;
  category_name: string;
  restaurant?: { id: string; nombre: string; direccion?: string; enable?: boolean };
}

export const getCandidates = async (editionId: number, category: string): Promise<SurveyCandidate[]> => {
  const { data } = await axios.get(`${API_V2}/category-restaurants/${editionId}/${encodeURIComponent(category)}`);
  return data;
};

/** Votos de cada candidato: `${categoría}|${restaurantId}` → votos. */
export const getVotesByCandidate = async (editionId: number): Promise<Record<string, number>> => {
  const { data } = await axios.get(`${API_V2}/surveys/v3/editions/${editionId}/results`);
  const out: Record<string, number> = {};
  for (const c of data?.categories ?? []) {
    for (const r of c.results ?? []) if (r.restaurantId) out[`${c.category}|${r.restaurantId}`] = r.votes ?? 0;
  }
  return out;
};

// ── Escrituras (a través del servidor del panel) ─────────────────────────
//
// Asignar y quitar candidatos exige `X-Admin-Key` (migration-backend/044). La
// clave no viaja al navegador: estas llamadas van a la ruta del propio panel
// `/api/encuesta/candidatos/`, que la añade en el servidor desde la variable de
// entorno `ENCUESTA_ADMIN_KEY` (nunca NEXT_PUBLIC_).

export class SurveyWriteError extends Error {
  constructor(public kind: "not_configured" | "unauthorized" | "other", message: string) {
    super(message);
  }
}

const asWriteError = (e: unknown): SurveyWriteError => {
  const res = (e as AxiosError<{ error?: string }>)?.response;
  if (res?.data?.error === "admin_key_missing" || res?.status === 503) {
    return new SurveyWriteError(
      "not_configured",
      "El panel no tiene configurado el acceso de administración de la encuesta (ENCUESTA_ADMIN_KEY)."
    );
  }
  if (res?.status === 401) {
    return new SurveyWriteError("unauthorized", "El servidor ha rechazado el acceso de administración de la encuesta.");
  }

  return new SurveyWriteError("other", "No se pudo guardar el cambio. Inténtalo de nuevo.");
};

export const assignCandidate = async (editionId: number, category: string, restaurantId: string): Promise<SurveyCandidate> => {
  try {
    const { data } = await axios.post("/api/encuesta/candidatos/", {
      survey_schema_id: editionId,
      category_name: category,
      restaurant_id: restaurantId,
    });

    return data;
  } catch (e) {
    throw asWriteError(e);
  }
};

export const removeCandidate = async (assignmentId: number): Promise<void> => {
  try {
    await axios.delete("/api/encuesta/candidatos/", { params: { id: assignmentId } });
  } catch (e) {
    throw asWriteError(e);
  }
};

// ── Catálogo para añadir (API V2: restaurantes, islas, municipios, tipos) ─

export interface CatalogItem {
  id: string;
  nombre: string;
  direccion: string;
  municipio: string;
  isla: string;
  tipo: string;
}

export const getCatalog = async (): Promise<CatalogItem[]> => {
  const [rest, islands, types] = await Promise.all([
    axios.get(`${API_V2}/restaurant`).then((r) => r.data),
    axios.get(`${API_V2}/islands`).then((r) => r.data),
    axios.get(`${API_V2}/types`).then((r) => r.data),
  ]);
  const muni: Record<string, { n: string; i: string }> = {};
  await Promise.all(
    (islands as any[]).map(async (isl) => {
      const { data } = await axios.get(`${API_V2}/municipios/islands/${isl.id}`);
      for (const m of data as any[]) muni[m.Id] = { n: m.Nombre, i: isl.name };
    })
  );
  const tipo: Record<string, string> = Object.fromEntries((types as any[]).map((t) => [t.id, t.name]));
  const clean = (s?: string | null) => (s || "").replace(/\s+/g, " ").trim();

  // Solo lo que hace falta: nunca se guarda el resto del objeto del restaurante.
  return (rest as any[])
    .map((r) => ({
      id: r.id,
      nombre: clean(r.nombre),
      direccion: clean(r.direccion),
      municipio: muni[r.NegocioMunicipioId]?.n ?? "",
      isla: muni[r.NegocioMunicipioId]?.i ?? "",
      tipo: tipo[r.restaurantTypeId] ?? "",
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
};
