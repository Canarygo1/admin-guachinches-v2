import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material'
import { registerAdminKeyRequester } from '../Data/obj/adminKeyPrompt'

/**
 * Diálogo global para pedir la clave de administración (`X-Admin-Key`) cuando
 * una escritura la necesita (migration-dashboard/011). Se monta una vez en
 * `_app`. La clave no se guarda aquí: `requestAdminKey` la pasa a
 * `sessionStorage`; nunca va al bundle ni a `NEXT_PUBLIC_*`.
 */
const AdminKeyDialog: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string | undefined>()
  const [value, setValue] = useState('')
  const resolver = useRef<((key: string | null) => void) | null>(null)

  useEffect(() => {
    registerAdminKeyRequester(
      why =>
        new Promise<string | null>(resolve => {
          resolver.current = resolve
          setReason(why)
          setValue('')
          setOpen(true)
        })
    )

    return () => registerAdminKeyRequester(null)
  }, [])

  const close = (key: string | null) => {
    setOpen(false)
    setValue('')
    resolver.current?.(key)
    resolver.current = null
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const key = value.trim()
    if (key) close(key)
  }

  return (
    <Dialog open={open} onClose={() => close(null)} maxWidth='xs' fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Clave de administración</DialogTitle>
        <DialogContent>
          {reason && (
            <Alert severity='warning' sx={{ mb: 2 }}>
              {reason}
            </Alert>
          )}
          <Typography variant='body2' sx={{ mb: 2 }}>
            Esta acción cambia datos en producción. Se guarda solo en esta pestaña y se borra al cerrarla.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type='password'
            label='X-Admin-Key'
            autoComplete='off'
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => close(null)}>Cancelar</Button>
          <Button type='submit' variant='contained' disabled={!value.trim()}>
            Continuar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AdminKeyDialog
