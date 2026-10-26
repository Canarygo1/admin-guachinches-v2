import React, { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, CardHeader, CircularProgress, TextField, Typography } from '@mui/material';
import { RestaurantAdmin } from '../Data/obj/restaurant';

export type PagosStatus = 'no_key' | 'loading' | 'ok' | 'unavailable' | 'not_configured' | 'error';

interface RestaurantPagosProps {
  status: PagosStatus;
  admin?: RestaurantAdmin | null;

  /** Fecha que aún traiga la ficha pública (antes del despliegue del backend). */
  publicUltimoPago?: string | null;
  keyError?: string | null;
  errorMessage?: string | null;
  onSubmitKey: (key: string) => void;
  onForgetKey: () => void;
  onRetry: () => void;
}

/** `YYYY-MM-DD` → `DD/MM/YYYY`; cualquier otra cosa tal cual. */
const fmt = (d?: string | null) => {
  if (!d) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);

  return m ? `${m[3]}/${m[2]}/${m[1]}` : d;
};

const Fecha = ({ label, value }: { label: string; value?: string | null }) => (
  <Typography variant='body2' sx={{ mb: 1 }}>
    <strong>{label}:</strong> {fmt(value)}
  </Typography>
);

/**
 * Datos de cobro de la ficha (migration-dashboard/010). Pide la clave de
 * administración, que solo se guarda en `sessionStorage`.
 */
const RestaurantPagos: React.FC<RestaurantPagosProps> = ({
  status,
  admin,
  publicUltimoPago,
  keyError,
  errorMessage,
  onSubmitKey,
  onForgetKey,
  onRetry
}) => {
  const [key, setKey] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = key.trim();
    if (!value) return;
    onSubmitKey(value);
    setKey('');
  };

  return (
    <Card sx={{ mt: 4 }}>
      <CardHeader title='Datos de cobro' />
      <CardContent>
        {status === 'no_key' && (
          <form onSubmit={handleSubmit}>
            {keyError && (
              <Alert severity='error' sx={{ mb: 2 }}>
                {keyError}
              </Alert>
            )}
            <Alert severity='info' sx={{ mb: 2 }}>
              Introduce la clave de administración para ver la fecha de último y próximo pago. Se guarda solo en esta
              pestaña. Sin ella, al guardar la ficha se conserva la fecha de último pago que ya esté guardada.
            </Alert>
            {publicUltimoPago && <Fecha label='Último pago (ficha pública)' value={publicUltimoPago} />}
            <TextField
              label='Clave de administración'
              type='password'
              autoComplete='off'
              value={key}
              onChange={e => setKey(e.target.value)}
              fullWidth
              margin='normal'
            />
            <Button type='submit' variant='outlined' disabled={!key.trim()}>
              Ver datos de cobro
            </Button>
          </form>
        )}

        {status === 'loading' && <CircularProgress size={24} />}

        {status === 'ok' && (
          <>
            <Fecha label='Último pago' value={admin?.ultimoPago} />
            <Fecha label='Próximo pago' value={admin?.proximoPago} />
          </>
        )}

        {status === 'unavailable' && (
          <>
            <Alert severity='info' sx={{ mb: 2 }}>
              El servidor todavía no ofrece los datos de cobro protegidos; se usa lo que trae la ficha.
            </Alert>
            <Fecha label='Último pago' value={publicUltimoPago} />
          </>
        )}

        {status === 'not_configured' && <Alert severity='warning'>{errorMessage}</Alert>}

        {status === 'error' && (
          <Alert
            severity='error'
            action={
              <Button color='inherit' size='small' onClick={onRetry}>
                Reintentar
              </Button>
            }
          >
            {errorMessage}
          </Alert>
        )}

        {status !== 'no_key' && status !== 'loading' && (
          <Box sx={{ mt: 2 }}>
            <Button size='small' onClick={onForgetKey}>
              Olvidar clave
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RestaurantPagos;
