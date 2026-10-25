import React, { useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
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
import { DataGrid, GridColumns, esES } from "@mui/x-data-grid";
import { Refresh, Send, TestTube } from "mdi-material-ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_V2, CatalogItem, getCatalog } from "src/Data/obj/survey";
import {
  PUSH_BODY_MAX,
  PUSH_ROUTES,
  PUSH_TITLE_MAX,
  PUSH_TOPICS,
  PushError,
  PushInput,
  PushLogEntry,
  PushRoute,
  PushTopic,
  getCuratedLists,
  getPushHistory,
  isValidPushLink,
  linkFicha,
  linkLista,
  linkVotar,
  sendPush,
} from "src/Data/obj/push";

/**
 * Notificaciones push a los suscritos de la app, por temas. Formulario con
 * vista previa tipo iPhone, envío de prueba (Firebase valida sin enviar),
 * envío real con confirmación e historial de los últimos envíos.
 */

type Destino = "none" | "ficha" | "lista" | "votar" | "ranking" | "url";

const DESTINOS: { key: Destino; label: string }[] = [
  { key: "none", label: "Nada (abre la app)" },
  { key: "ficha", label: "Ficha de un sitio" },
  { key: "lista", label: "Lista" },
  { key: "votar", label: "Votar a un sitio" },
  { key: "ranking", label: "Ranking de Premios" },
  { key: "url", label: "URL personalizada" },
];

const topicLabel = (k: string) => PUSH_TOPICS.find((t) => t.key === k)?.label ?? k;
const routeLabel = (k: string) => PUSH_ROUTES.find((r) => r.key === k)?.label ?? k;

const fechaHora = (iso: string) => {
  const d = new Date(iso);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/** Destino legible a partir de link/route (para el historial y la confirmación). */
const destinoTexto = (link?: string | null, route?: string | null) => {
  if (route) return `Pantalla: ${routeLabel(route)}`;
  if (!link) return "Abre la app";
  const m = link.match(/\/(restaurante|listas|premios\/votar)\/([^/?#]+)/);
  if (m?.[1] === "restaurante") return `Ficha: ${m[2]}`;
  if (m?.[1] === "listas") return `Lista: ${decodeURIComponent(m[2])}`;
  if (m?.[1] === "premios/votar") return "Votar a un sitio";

  return link;
};

const Counter = ({ n, max }: { n: number; max: number }) => (
  <Box component="span" sx={{ color: n > max ? "error.main" : n > max * 0.9 ? "warning.main" : "text.secondary" }}>
    {n}/{max}
  </Box>
);

/** Vista previa con el aspecto de una notificación de iOS en la pantalla de bloqueo. */
const IphonePreview = ({ title, body }: { title: string; body: string }) => (
  <Box
    sx={{
      borderRadius: 6,
      p: 3,
      minHeight: 260,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      background: "linear-gradient(160deg, #1f4e6b 0%, #2f7d8c 45%, #e3a35b 100%)",
    }}
  >
    <Typography sx={{ color: "rgba(255,255,255,.9)", textAlign: "center", fontSize: 13, fontWeight: 500 }}>
      {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
    </Typography>
    <Typography sx={{ color: "#fff", textAlign: "center", fontSize: 54, fontWeight: 300, lineHeight: 1.1, mb: 3 }}>
      {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
    </Typography>
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        alignItems: "flex-start",
        p: 1.5,
        borderRadius: 4,
        bgcolor: "rgba(245,245,245,.82)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 2px 12px rgba(0,0,0,.12)",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <Box
        component="img"
        src="/images/app-icon.png"
        alt=""
        sx={{ width: 38, height: 38, borderRadius: "9px", flex: "none", bgcolor: "#fff" }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
          <Typography noWrap sx={{ fontSize: 15, fontWeight: 600, color: "#111", fontFamily: "inherit" }}>
            {title.trim() || "Título de la notificación"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "rgba(60,60,67,.6)", flex: "none", fontFamily: "inherit" }}>ahora</Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 15,
            color: "#111",
            lineHeight: 1.3,
            fontFamily: "inherit",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {body.trim() || "Texto de la notificación"}
        </Typography>
      </Box>
    </Box>
  </Box>
);

function Notificaciones() {
  const qc = useQueryClient();

  const [topic, setTopic] = useState<PushTopic>("novedades");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [destino, setDestino] = useState<Destino>("none");
  const [sitio, setSitio] = useState<CatalogItem | null>(null);
  const [listaId, setListaId] = useState("");
  const [url, setUrl] = useState("");

  const [sending, setSending] = useState<"dry" | "real" | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<{ severity: "success" | "error"; title: string; text: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── Datos ──────────────────────────────────────────────────────────────
  const needsSitio = destino === "ficha" || destino === "votar";
  const catalog = useQuery({
    queryKey: ["surveyCatalog"],
    queryFn: getCatalog,
    enabled: needsSitio,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60_000,
  });
  const lists = useQuery({
    queryKey: ["curatedLists"],
    queryFn: () => getCuratedLists(API_V2),
    enabled: destino === "lista",
    refetchOnWindowFocus: false,
    staleTime: 10 * 60_000,
  });
  const history = useQuery<PushLogEntry[], PushError>({
    queryKey: ["pushHistory"],
    queryFn: () => getPushHistory(20),
    refetchOnWindowFocus: false,
    retry: false,
  });

  // ── Destino → link / route ─────────────────────────────────────────────
  const target = useMemo((): { link?: string; route?: PushRoute; missing?: string; invalid?: boolean } => {
    switch (destino) {
      case "ficha":
        return sitio ? { link: linkFicha(sitio) } : { missing: "Elige el sitio" };
      case "votar":
        return sitio ? { link: linkVotar(sitio.id) } : { missing: "Elige el sitio" };
      case "lista":
        return listaId ? { link: linkLista(listaId) } : { missing: "Elige la lista" };
      case "ranking":
        return { route: "premios_ranking" };
      case "url": {
        const u = url.trim();
        if (!u) return { missing: "Escribe la URL" };

        return isValidPushLink(u) ? { link: u } : { link: u, invalid: true };
      }
      default:
        return {};
    }
  }, [destino, sitio, listaId, url]);

  const titleLen = title.trim().length;
  const bodyLen = body.trim().length;
  const formOk = titleLen > 0 && titleLen <= PUSH_TITLE_MAX && bodyLen > 0 && bodyLen <= PUSH_BODY_MAX && !target.missing && !target.invalid;

  const payload = (dryRun: boolean): PushInput => ({
    topic,
    title: title.trim(),
    body: body.trim(),
    ...(target.link ? { link: target.link } : {}),
    ...(target.route ? { route: target.route } : {}),
    dryRun,
  });

  const send = async (dryRun: boolean) => {
    setSending(dryRun ? "dry" : "real");
    setResult(null);
    try {
      const r = await sendPush(payload(dryRun));
      if (dryRun) {
        setResult({
          severity: "success",
          title: "Prueba correcta",
          text: "Firebase ha validado la notificación sin enviarla a nadie. Puedes enviarla a todos.",
        });
      } else {
        setResult({
          severity: "success",
          title: "Notificación enviada",
          text: `Enviada a los suscritos a «${topicLabel(topic)}»${r.messageId ? ` (id ${r.messageId})` : ""}.`,
        });
        setToast("Notificación enviada");
      }
    } catch (e) {
      const err = e instanceof PushError ? e : new PushError("other", "Error inesperado.");
      setResult({ severity: "error", title: dryRun ? "La prueba ha fallado" : "No se ha enviado", text: err.message });
    } finally {
      setSending(null);
      qc.invalidateQueries({ queryKey: ["pushHistory"] });
    }
  };

  // ── Historial ──────────────────────────────────────────────────────────
  const columns: GridColumns<PushLogEntry> = [
    {
      field: "created_at",
      headerName: "Fecha",
      width: 170,
      valueGetter: (p) => p.row.created_at,
      renderCell: (p) => fechaHora(p.row.created_at),
    },
    {
      field: "topic",
      headerName: "Tema",
      width: 190,
      renderCell: (p) => <Chip size="small" label={topicLabel(p.row.topic)} color={p.row.topic === "premios" ? "warning" : "info"} variant="outlined" />,
    },
    {
      field: "title",
      headerName: "Título",
      flex: 1,
      minWidth: 220,
      renderCell: (p) => (
        <Tooltip title={p.row.body}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.row.title}</span>
        </Tooltip>
      ),
    },
    {
      field: "destino",
      headerName: "Destino",
      flex: 1,
      minWidth: 200,
      sortable: false,
      valueGetter: (p) => destinoTexto(p.row.link, p.row.route),
      renderCell: (p) =>
        p.row.link ? (
          <Link href={p.row.link} target="_blank" rel="noreferrer" noWrap>
            {destinoTexto(p.row.link, p.row.route)}
          </Link>
        ) : (
          destinoTexto(p.row.link, p.row.route)
        ),
    },
    {
      field: "dry_run",
      headerName: "Tipo",
      width: 110,
      renderCell: (p) => (p.row.dry_run ? <Chip size="small" label="Prueba" /> : <Chip size="small" label="Real" color="success" />),
    },
  ];

  const busy = sending !== null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Notificaciones
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Envía una notificación push a quienes se han suscrito a un tema en la app. Primero haz una prueba: Firebase la valida sin
        enviarla.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader title="Nueva notificación" />
            <CardContent>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel id="push-topic">Tema</InputLabel>
                  <Select labelId="push-topic" label="Tema" value={topic} onChange={(e) => setTopic(e.target.value as PushTopic)}>
                    {PUSH_TOPICS.map((t) => (
                      <MenuItem key={t.key} value={t.key}>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Solo la recibirán quienes tengan activado este tema.</FormHelperText>
                </FormControl>

                <TextField
                  label="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  inputProps={{ maxLength: PUSH_TITLE_MAX }}
                  helperText={<Counter n={titleLen} max={PUSH_TITLE_MAX} />}
                  FormHelperTextProps={{ sx: { textAlign: "right" } }}
                  fullWidth
                />
                <TextField
                  label="Texto"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  inputProps={{ maxLength: PUSH_BODY_MAX }}
                  helperText={<Counter n={bodyLen} max={PUSH_BODY_MAX} />}
                  FormHelperTextProps={{ sx: { textAlign: "right" } }}
                  multiline
                  minRows={3}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel id="push-destino">Al tocarla, abrir…</InputLabel>
                  <Select
                    labelId="push-destino"
                    label="Al tocarla, abrir…"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value as Destino)}
                  >
                    {DESTINOS.map((d) => (
                      <MenuItem key={d.key} value={d.key}>
                        {d.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {needsSitio && (
                  <Autocomplete
                    options={catalog.data ?? []}
                    loading={catalog.isLoading}
                    value={sitio}
                    onChange={(_e, v) => setSitio(v)}
                    getOptionLabel={(o) => o.nombre}
                    isOptionEqualToValue={(a, b) => a.id === b.id}
                    filterOptions={(opts, s) => {
                      const q = s.inputValue
                        .normalize("NFD")
                        .replace(/[̀-ͯ]/g, "")
                        .toLowerCase()
                        .trim();
                      if (!q) return opts.slice(0, 50);

                      return opts
                        .filter((o) =>
                          `${o.nombre} ${o.municipio} ${o.isla}`
                            .normalize("NFD")
                            .replace(/[̀-ͯ]/g, "")
                            .toLowerCase()
                            .includes(q)
                        )
                        .slice(0, 50);
                    }}
                    renderOption={(props, o) => (
                      <li {...props} key={o.id}>
                        <Box>
                          <Typography variant="body2">{o.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[o.municipio, o.isla].filter(Boolean).join(" · ") || o.direccion}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar sitio"
                        error={catalog.isError}
                        helperText={catalog.isError ? "No se pudo cargar el catálogo de sitios." : undefined}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {catalog.isLoading ? <CircularProgress size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                )}

                {destino === "lista" && (
                  <FormControl fullWidth error={lists.isError}>
                    <InputLabel id="push-lista">Lista</InputLabel>
                    <Select labelId="push-lista" label="Lista" value={listaId} onChange={(e) => setListaId(e.target.value)}>
                      {lists.isLoading && <MenuItem disabled>Cargando…</MenuItem>}
                      {(lists.data ?? []).map((l) => (
                        <MenuItem key={l.id} value={l.id}>
                          {l.title}
                          {l.location ? ` · ${l.location}` : ""}
                        </MenuItem>
                      ))}
                    </Select>
                    {lists.isError && <FormHelperText>No se pudieron cargar las listas.</FormHelperText>}
                  </FormControl>
                )}

                {destino === "url" && (
                  <TextField
                    label="URL"
                    placeholder="https://guachinchesmodernos.com/…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    error={!!target.invalid}
                    helperText={
                      target.invalid
                        ? "Solo https de guachinchesmodernos.com o dondecomercanarias.com, o dondecomercanarias://"
                        : "https de guachinchesmodernos.com o dondecomercanarias.com, o dondecomercanarias://"
                    }
                    fullWidth
                  />
                )}

                {(target.link || target.route) && !target.invalid && (
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                    Destino: {target.route ? `pantalla «${routeLabel(target.route)}» de la app` : target.link}
                  </Typography>
                )}

                {result && (
                  <Alert severity={result.severity} onClose={() => setResult(null)}>
                    <AlertTitle>{result.title}</AlertTitle>
                    {result.text}
                  </Alert>
                )}

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    startIcon={sending === "dry" ? <CircularProgress size={16} /> : <TestTube />}
                    disabled={!formOk || busy}
                    onClick={() => send(true)}
                  >
                    Enviar prueba
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={sending === "real" ? <CircularProgress size={16} color="inherit" /> : <Send />}
                    disabled={!formOk || busy}
                    onClick={() => setConfirm(true)}
                  >
                    Enviar a todos los suscritos
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader title="Vista previa" subheader="Así se verá en un iPhone (aproximado)" />
            <CardContent>
              <IphonePreview title={title} body={body} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Historial"
              subheader="Últimos 20 envíos"
              action={
                <Tooltip title="Actualizar">
                  <IconButton onClick={() => history.refetch()} disabled={history.isFetching}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              }
            />
            {history.isError ? (
              <CardContent>
                <Alert severity="error">{history.error?.message ?? "No se pudo cargar el historial."}</Alert>
              </CardContent>
            ) : (
              <Box sx={{ height: 460, px: 2, pb: 2 }}>
                <DataGrid
                  rows={history.data ?? []}
                  columns={columns}
                  getRowId={(r) => r.id}
                  loading={history.isLoading}
                  disableSelectionOnClick
                  hideFooterSelectedRowCount
                  pageSize={20}
                  rowsPerPageOptions={[20]}
                  localeText={{ ...esES.components.MuiDataGrid.defaultProps.localeText, noRowsLabel: "Aún no hay envíos" }}
                  initialState={{ sorting: { sortModel: [{ field: "created_at", sort: "desc" }] } }}
                />
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirm} onClose={() => setConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>¿Enviar a todos los suscritos?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Se enviará ahora a todos los suscritos al tema <b>«{topicLabel(topic)}»</b>. No se puede deshacer.
          </DialogContentText>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Título
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{title.trim()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Texto
              </Typography>
              <Typography sx={{ whiteSpace: "pre-wrap" }}>{body.trim()}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Al tocarla
              </Typography>
              <Typography sx={{ wordBreak: "break-all" }}>{destinoTexto(target.link, target.route)}</Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => {
              setConfirm(false);
              send(false);
            }}
          >
            Enviar a todos
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={(_e, reason) => reason !== "clickaway" && setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Notificaciones;
