import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  TextField,
  Switch,
  FormControlLabel,
  Autocomplete,
  Grid,
  Button,
  Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Area } from '../Data/obj/municipality';
import {updateRestaurantDetails, UpdateRestaurantDetailsData} from "../Data/obj/restaurant";

interface RestaurantFormProps {
  restaurantId: string;
  editableFields: UpdateRestaurantDetailsData;
  municipios: (Area & { zoneName: string })[];
  handleChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { checked: boolean }>) => void;
  handleMunicipioChange: (event: any, newValue: Area | null) => void;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
                                                         restaurantId,
                                                         editableFields,
                                                         municipios,
                                                         handleChange,
                                                         handleMunicipioChange
                                                       }) => {
  const queryClient = useQueryClient();
  const mutation = useMutation(
    {
      mutationFn: (args: UpdateRestaurantDetailsData) => updateRestaurantDetails(restaurantId, args),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['restaurantDetails'] });
      },
    },
  );


  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate(editableFields);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title="Información basica" />
      <CardContent sx={{ flexGrow: 1 }}>
        <form onSubmit={handleSubmit}>
          <FormControlLabel
            control={
              <Switch
                checked={editableFields.enable}
                onChange={handleChange('enable')}
                name="enable"
                color="primary"
              />
            }
            label="Enable"
          />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                value={editableFields.nombre}
                onChange={handleChange('nombre')}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Link de reserva"
                value={editableFields.link_reserva}
                onChange={handleChange('link_reserva')}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Link de Instagram"
                value={editableFields.instagram_link}
                onChange={handleChange('instagram_link')}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Link del Menu"
                value={editableFields.menu_link}
                onChange={handleChange('menu_link')}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={municipios}
                getOptionLabel={(option) => option.Nombre}
                groupBy={(option) => option.zoneName}
                value={editableFields.municipio}
                onChange={handleMunicipioChange}
                renderInput={(params) => <TextField {...params} label="Seleccionar Municipio" variant="outlined" fullWidth margin="normal" />}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Horarios"
                value={editableFields.horarios}
                onChange={handleChange('horarios')}
                fullWidth
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Dirección"
                value={editableFields.direccion}
                onChange={handleChange('direccion')}
                fullWidth
                margin="normal"
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Teléfono"
                value={editableFields.telefono}
                onChange={handleChange('telefono')}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Google URL"
                value={editableFields.googleUrl}
                onChange={handleChange('googleUrl')}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={mutation.isPending}>
                {mutation.isPending ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </Grid>
            {mutation.isError && (
              <Grid item xs={12}>
                <Alert severity="error">Error: {(mutation.error as Error).message}</Alert>
              </Grid>
            )}
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default RestaurantForm;
