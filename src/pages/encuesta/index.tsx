"use client";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColumns, GridSelectionModel, esES } from "@mui/x-data-grid";
import { Close, DeleteOutline, Magnify, OpenInNew, Plus } from "mdi-material-ui";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CatalogItem,
  SURVEY_CATEGORIES,
  SurveyCandidate,
  SurveyWriteError,
  assignCandidate,
  getCandidates,
  getCatalog,
  getCurrentEdition,
  getVotesByCandidate,
  removeCandidate,
} from "src/Data/obj/survey";

/**
 * Candidatos de la votación en curso (Premios). Se elige la categoría en el
 * selector; la tabla lista sus candidatos (buscar, ordenar, quitar uno o
 * varios) y «Añadir negocios» abre un panel para añadir varios a la vez.
 */

type Cat = (typeof SURVEY_CATEGORIES)[number];

interface Row extends CatalogItem {
  assignmentId: number;
  votes: number;
  others: Cat[];
  inactive: boolean;
}

type Op = { kind: "add" | "remove"; cat: Cat; items: CatalogItem[] };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const STATUS: Record<string, { label: string; color: "success" | "warning" | "default" }> = {
  open: { label: "Abierta", color: "success" },
  upcoming: { label: "Próximamente", color: "warning" },
  closed: { label: "Cerrada", color: "default" },
};

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "—";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const Dot = ({ color, size = 10 }: { color: string; size?: number }) => (
  <Box component="span" sx={{ display: "inline-block", width: size, height: size, borderRadius: "50%", bgcolor: color, flex: "none" }} />
);

function SurveyCandidates() {
  const qc = useQueryClient();
  const [catKey, setCatKey] = useState<string>(SURVEY_CATEGORIES[0].key);
  const cat = SURVEY_CATEGORIES.find((c) => c.key === catKey) ?? SURVEY_CATEGORIES[0];

  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<GridSelectionModel>([]);
  const [pageSize, setPageSize] = useState(25);

  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");
  const [isla, setIsla] = useState("");
  const [tipo, setTipo] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<{ op: Op; votes: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: Op; error?: boolean } | null>(null);

  // ── Datos ──────────────────────────────────────────────────────────────
  const edition = useQuery({ queryKey: ["surveyEdition"], queryFn: getCurrentEdition, refetchOnWindowFocus: false });
  const editionId = edition.data?.editionId;

  const lists = useQueries({
    queries: SURVEY_CATEGORIES.map((c) => ({
      queryKey: ["surveyCandidates", editionId, c.key],
      queryFn: () => getCandidates(editionId!, c.key),
      enabled: !!editionId,
      refetchOnWindowFocus: false,
    })),
  });
  const votes = useQuery({
    queryKey: ["surveyVotes", editionId],
    queryFn: () => getVotesByCandidate(editionId!),
    enabled: !!editionId,
    refetchOnWindowFocus: false,
  });
  const catalog = useQuery({ queryKey: ["surveyCatalog"], queryFn: getCatalog, refetchOnWindowFocus: false, staleTime: 10 * 60_000 });

  const listsKey = lists.map((l) => l.dataUpdatedAt).join();

  /** categoría → (restaurantId → asignación) */
  const byCat = useMemo(() => {
    const m: Record<string, Map<string, SurveyCandidate>> = {};
    SURVEY_CATEGORIES.forEach((c, i) => {
      m[c.key] = new Map((lists[i].data ?? []).map((a) => [a.restaurant_id, a]));
    });

    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listsKey]);

  const catalogById = useMemo(() => new Map((catalog.data ?? []).map((c) => [c.id, c])), [catalog.data]);
  const count = (k: string) => byCat[k]?.size ?? 0;

  const rows: Row[] = useMemo(() => {
    const s = norm(search);

    return [...(byCat[cat.key]?.values() ?? [])]
      .map((a) => {
        const it = catalogById.get(a.restaurant_id);

        return {
          id: a.restaurant_id,
          nombre: (it?.nombre ?? a.restaurant?.nombre ?? "Sin nombre").replace(/\s+/g, " ").trim(),
          direccion: it?.direccion ?? a.restaurant?.direccion ?? "",
          municipio: it?.municipio ?? "",
          isla: it?.isla ?? "",
          tipo: it?.tipo ?? "",
          assignmentId: a.id,
          votes: votes.data?.[`${cat.key}|${a.restaurant_id}`] ?? 0,
          others: SURVEY_CATEGORIES.filter((o) => o.key !== cat.key && byCat[o.key]?.has(a.restaurant_id)),
          inactive: a.restaurant?.enable === false || (!!catalog.data && !it),
        };
      })
      .filter((r) => !s || norm(`${r.nombre} ${r.direccion} ${r.municipio} ${r.isla}`).includes(s));
  }, [byCat, cat.key, catalogById, catalog.data, votes.data, search]);

  // ── Escrituras ─────────────────────────────────────────────────────────
  const run = async (op: Op, withUndo = true) => {
    setSaving(true);
    try {
      const done: CatalogItem[] = [];
      for (const it of op.items) {
        if (op.kind === "add") {
          if (byCat[op.cat.key]?.has(it.id)) continue;
          await assignCandidate(editionId!, op.cat.key, it.id);
        } else {
          const a = byCat[op.cat.key]?.get(it.id);
          if (!a) continue;
          await removeCandidate(a.id);
        }
        done.push(it);
      }
      await qc.invalidateQueries({ queryKey: ["surveyCandidates", editionId, op.cat.key] });
      qc.invalidateQueries({ queryKey: ["surveyEdition"] });
      const what = done.length === 1 ? done[0].nombre : plural(done.length, "negocio", "negocios");
      setToast({
        text: `${what} ${op.kind === "add" ? "añadido" : "quitado"}${done.length > 1 ? "s" : ""} ${op.kind === "add" ? "a" : "de"} ${op.cat.title.toLowerCase()}`,
        undo: withUndo && done.length ? { kind: op.kind === "add" ? "remove" : "add", cat: op.cat, items: done } : undefined,
      });
    } catch (e) {
      await qc.invalidateQueries({ queryKey: ["surveyCandidates", editionId, op.cat.key] });
      setToast({ text: e instanceof SurveyWriteError ? e.message : "No se pudo guardar el cambio.", error: true });
    } finally {
      setSaving(false);
    }
  };

  /** Quitar pide confirmación si alguno ya tiene votos. */
  const remove = (items: CatalogItem[]) => {
    const op: Op = { kind: "remove", cat, items };
    const v = items.reduce((s, it) => s + (votes.data?.[`${cat.key}|${it.id}`] ?? 0), 0);
    if (v > 0) setConfirm({ op, votes: v });
    else run(op);
    setSelection([]);
  };

  // ── Panel «Añadir negocios» ────────────────────────────────────────────
  const islas = useMemo(() => [...new Set((catalog.data ?? []).map((c) => c.isla).filter(Boolean))].sort(), [catalog.data]);
  const tipos = useMemo(() => [...new Set((catalog.data ?? []).map((c) => c.tipo).filter(Boolean))].sort(), [catalog.data]);

  const results = useMemo(() => {
    const s = norm(q);

    return (catalog.data ?? []).filter((it) => {
      if (isla && it.isla !== isla) return false;
      if (tipo && (tipo === "(sin tipo)" ? it.tipo : it.tipo !== tipo)) return false;

      return !s || norm(`${it.nombre} ${it.direccion} ${it.municipio}`).includes(s);
    });
  }, [catalog.data, q, isla, tipo]);

  const openDrawer = () => {
    setPicked(new Set());
    setQ("");
    setDrawer(true);
  };

  const togglePick = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);

      return n;
    });

  const addPicked = async () => {
    const items = [...picked].map((id) => catalogById.get(id)).filter(Boolean) as CatalogItem[];
    setDrawer(false);
    await run({ kind: "add", cat, items });
  };

  // ── Columnas ───────────────────────────────────────────────────────────
  const columns: GridColumns<Row> = [
    {
      field: "nombre",
      headerName: "Negocio",
      flex: 1.6,
      minWidth: 240,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0, py: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap title={row.nombre}>
            {row.nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div" title={row.direccion}>
            {row.direccion || "Sin dirección"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "municipio",
      headerName: "Municipio",
      flex: 1,
      minWidth: 150,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap>
            {row.municipio || "—"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.isla}
          </Typography>
        </Box>
      ),
    },
    { field: "tipo", headerName: "Tipo", flex: 0.9, minWidth: 140, valueGetter: ({ row }) => row.tipo || "—" },
    {
      field: "votes",
      headerName: "Votos",
      type: "number",
      width: 90,
      renderCell: ({ row }) => (
        <Typography variant="body2" fontWeight={row.votes ? 600 : 400} color={row.votes ? "text.primary" : "text.disabled"}>
          {row.votes}
        </Typography>
      ),
    },
    {
      field: "others",
      headerName: "Avisos",
      flex: 1,
      minWidth: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5 }}>
          {row.others.map((o) => (
            <Tooltip key={o.key} title="Cada móvil vota una sola vez a cada negocio: solo podrá votarlo en una categoría.">
              <Chip size="small" variant="outlined" icon={<Dot color={o.color} size={8} />} label={`También en ${o.short}`} />
            </Tooltip>
          ))}
          {row.inactive && <Chip size="small" color="error" variant="outlined" label="Inactivo" />}
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 96,
      sortable: false,
      disableColumnMenu: true,
      align: "right",
      renderCell: ({ row }) => (
        <Stack direction="row">
          <Tooltip title="Ver en Google Maps">
            <IconButton
              size="small"
              component={Link}
              href={`https://www.google.com/maps/search/${encodeURIComponent(`${row.nombre} ${row.direccion || row.municipio}`)}`}
              target="_blank"
              rel="noopener"
              aria-label={`Ver ${row.nombre} en Google Maps`}
            >
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quitar de la categoría">
            <span>
              <IconButton size="small" color="error" disabled={saving} onClick={() => remove([row])} aria-label={`Quitar ${row.nombre}`}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  if (edition.isLoading) {
    return (
      <Box sx={{ p: 10, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (edition.isError || !edition.data) return <Alert severity="error">No se pudo cargar la edición en curso de los Premios.</Alert>;

  const ed = edition.data;
  const st = STATUS[ed.status] ?? STATUS.closed;
  const listLoading = lists[SURVEY_CATEGORIES.indexOf(cat)].isLoading;
  const selectedItems = rows.filter((r) => selection.includes(r.id));
  const hidden = !ed.categories.includes(cat.key);

  return (
    <Box>
      {/* Cabecera */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between" alignItems={{ md: "flex-end" }} sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Candidatos de la votación
          </Typography>
          <Stack direction="row" alignItems="center" sx={{ mt: 1.5, flexWrap: "wrap", gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {ed.label}
            </Typography>
            <Chip size="small" label={st.label} color={st.color} sx={{ fontWeight: 600 }} />
            <Typography variant="body2" color="text.secondary">
              {fecha(ed.votingStartsAt)} – {fecha(ed.votingEndsAt)}
            </Typography>
          </Stack>
        </Box>

        <FormControl sx={{ minWidth: { xs: "100%", md: 320 } }}>
          <InputLabel id="cat-label">Categoría</InputLabel>
          <Select
            labelId="cat-label"
            label="Categoría"
            value={cat.key}
            onChange={(e) => {
              setCatKey(e.target.value);
              setSelection([]);
              setSearch("");
            }}
            renderValue={(v) => {
              const c = SURVEY_CATEGORIES.find((x) => x.key === v)!;

              return (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Dot color={c.color} />
                  <span>{c.title}</span>
                </Stack>
              );
            }}
          >
            {SURVEY_CATEGORIES.map((c) => (
              <MenuItem key={c.key} value={c.key}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
                  <Dot color={c.color} />
                  <Box sx={{ flex: 1 }}>{c.title}</Box>
                  <Typography variant="caption" color="text.secondary">
                    {lists[SURVEY_CATEGORIES.indexOf(c)].isLoading ? "…" : count(c.key)}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Card>
        {/* Barra de la tabla */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          sx={{ px: 5, py: 4 }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Dot color={cat.color} size={12} />
              <Typography variant="h6">{cat.title}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {listLoading ? "Cargando…" : plural(count(cat.key), "candidato", "candidatos")}
              {hidden && !listLoading && " · no sale en la app hasta que tenga al menos uno"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Buscar candidato"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: { xs: "100%", sm: 260 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Magnify fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" startIcon={<Plus />} onClick={openDrawer} disabled={!catalog.data} sx={{ whiteSpace: "nowrap" }}>
              Añadir negocios
            </Button>
          </Stack>
        </Stack>

        {selection.length > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 5, py: 1.5, bgcolor: "action.selected", borderTop: 1, borderColor: "divider" }}
          >
            <Typography variant="body2" fontWeight={600}>
              {plural(selection.length, "seleccionado", "seleccionados")}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setSelection([])}>
                Cancelar
              </Button>
              <Button size="small" color="error" variant="contained" startIcon={<DeleteOutline />} disabled={saving} onClick={() => remove(selectedItems)}>
                Quitar de la categoría
              </Button>
            </Stack>
          </Stack>
        )}

        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={listLoading || saving}
          checkboxSelection
          disableSelectionOnClick
          selectionModel={selection}
          onSelectionModelChange={setSelection}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          rowsPerPageOptions={[25, 50, 100]}
          rowHeight={64}
          localeText={{
            ...esES.components.MuiDataGrid.defaultProps.localeText,
            noRowsLabel: search ? "Ningún candidato coincide con la búsqueda" : "Todavía no hay candidatos en esta categoría",
          }}
          sx={{ border: 0, borderTop: 1, borderColor: "divider", borderRadius: 0, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" } }}
        />
      </Card>

      {/* Panel lateral: añadir varios negocios */}
      <Drawer anchor="right" open={drawer} onClose={() => setDrawer(false)} PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}>
        <Stack sx={{ height: "100%" }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ px: 5, pt: 5, pb: 3 }}>
            <Box>
              <Typography variant="h6">Añadir negocios</Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <Dot color={cat.color} size={8} />
                <Typography variant="body2" color="text.secondary">
                  {cat.title}
                </Typography>
              </Stack>
            </Box>
            <IconButton onClick={() => setDrawer(false)} aria-label="Cerrar">
              <Close />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ px: 5, pb: 3 }}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="Buscar por nombre, dirección o municipio"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Magnify fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Isla</InputLabel>
                <Select label="Isla" value={isla} onChange={(e) => setIsla(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {islas.map((i) => (
                    <MenuItem key={i} value={i}>
                      {i}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {tipos.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                  <MenuItem value="(sin tipo)">Sin tipo</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {plural(results.length, "resultado", "resultados")}
            </Typography>
          </Stack>
          <Divider />

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {results.slice(0, 200).map((it) => {
              const already = byCat[cat.key]?.has(it.id) ?? false;
              const on = already || picked.has(it.id);
              const others = SURVEY_CATEGORIES.filter((o) => o.key !== cat.key && byCat[o.key]?.has(it.id));

              return (
                <Box
                  key={it.id}
                  onClick={() => !already && togglePick(it.id)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 3,
                    py: 1.25,
                    borderBottom: 1,
                    borderColor: "divider",
                    cursor: already ? "default" : "pointer",
                    opacity: already ? 0.6 : 1,
                    bgcolor: picked.has(it.id) ? "action.selected" : "transparent",
                    "&:hover": already ? undefined : { bgcolor: picked.has(it.id) ? "action.selected" : "action.hover" },
                  }}
                >
                  <Checkbox checked={on} disabled={already} size="small" inputProps={{ "aria-label": `Seleccionar ${it.nombre}` }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap title={it.nombre}>
                      {it.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap component="div">
                      {[it.municipio || "Sin municipio", it.isla, it.tipo].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                  {already ? (
                    <Chip size="small" label="Ya está" />
                  ) : (
                    others.map((o) => (
                      <Tooltip key={o.key} title={`Ya es candidato en ${o.title.toLowerCase()}`}>
                        <Chip size="small" variant="outlined" icon={<Dot color={o.color} size={8} />} label={o.short} />
                      </Tooltip>
                    ))
                  )}
                </Box>
              );
            })}
            {results.length > 200 && (
              <Typography variant="caption" color="text.secondary" component="div" sx={{ p: 3, textAlign: "center" }}>
                Se muestran los 200 primeros. Afina la búsqueda para ver el resto.
              </Typography>
            )}
            {results.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 6, textAlign: "center" }}>
                Ningún negocio coincide con la búsqueda.
              </Typography>
            )}
          </Box>

          <Divider />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 5, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {picked.size ? plural(picked.size, "seleccionado", "seleccionados") : "Selecciona uno o varios"}
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <Button onClick={() => setDrawer(false)}>Cancelar</Button>
              <Button variant="contained" disabled={!picked.size || saving} onClick={addPicked}>
                {picked.size > 1 ? `Añadir ${picked.size}` : "Añadir"}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Drawer>

      {/* Confirmación: quitar candidatos con votos */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {confirm?.op.items.length === 1 ? `¿Quitar ${confirm.op.items[0].nombre}?` : `¿Quitar ${confirm?.op.items.length} candidatos?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm?.op.items.length === 1 ? "Tiene" : "Entre todos tienen"} {plural(confirm?.votes ?? 0, "voto", "votos")} en{" "}
            {confirm?.op.cat.title.toLowerCase()}. Al quitarlos dejan de salir en el ranking y no se podrán votar en esta categoría.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 4 }}>
          <Button onClick={() => setConfirm(null)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (confirm) run(confirm.op);
              setConfirm(null);
            }}
          >
            Quitar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={6000}
        onClose={(_e, reason) => reason !== "clickaway" && setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast?.error ? "error" : "success"}
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ alignItems: "center" }}
          action={
            toast?.undo ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  const u = toast.undo!;
                  setToast(null);
                  run(u, false);
                }}
              >
                Deshacer
              </Button>
            ) : undefined
          }
        >
          {toast?.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SurveyCandidates;
