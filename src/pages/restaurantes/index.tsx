import React, { useState } from 'react';
import { Button, Card, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Alert } from "@mui/material";
import { DataGrid, esES } from "@mui/x-data-grid";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  addRestaurant,
  AddRestaurantArgs,
  deleteRestaurant,
  getAllBusiness,
  Restaurant
} from "../../Data/obj/restaurant";
import { Cancel, Check } from "mdi-material-ui";
import Autocomplete from '@mui/material/Autocomplete';
import {Area, getAllMunicipalities} from "../../Data/obj/municipality";

function Index() {
  const [filterName, setFilterName] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [deleteRestaurantId, setDeleteRestaurantId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [newRestaurant, setNewRestaurant] = useState<AddRestaurantArgs>({
    nombre: '',
    municipio: null,
    telefono: '',
    direccion: '',
  });

  const handleOpenDialogDelete = (id: string) => {
    setDeleteRestaurantId(id);
    setOpenDialogDelete(true);
  }
  const handleDeleteRestaurant = (id: string) => {
    deleteMutation.mutate(id);
    setOpenDialogDelete(false);
  }
  const columns = [
    { field: 'nombre', headerName: 'Nombre', width: 300 },
    { field: 'Municipio', headerName: 'Municipio', width: 200, renderCell: (params: any) => params.row.municipio.Nombre },
    { field: 'telefono', headerName: 'Teléfono', flex: 0.4 },
    { field: 'Activo', headerName: 'Activo', flex: 0.4, renderCell: (params: any) => (params.row.enable ? <Check color={'success'} /> : <Cancel color={'error'} />) },
    { field: 'Detalles', headerName: 'Detalles', width: 100, renderCell: (params: any) => <Button href={"/restaurantes/" + params.row.id}>Abrir</Button> },
    { field: 'Borrar', headerName: 'Borrar', width: 100, renderCell: (params: any) => <Button onClick={()=>handleOpenDialogDelete(params.row.id)}>Borrar</Button> }
  ];

  const { data: restaurants, isLoading: isRestaurantsLoading, isError: isRestaurantError, error: errorRestaurant } = useQuery<Restaurant[], Error>({
    queryFn: getAllBusiness,
    queryKey: ['restaurants'],
    refetchOnWindowFocus: false,
  });

  const { data: municipalities, isLoading: isMunicipalitiesLoading, isError: isMunicipalitiesError, error: errorMunicipalities } = useQuery<Area[], Error>({
    queryFn: getAllMunicipalities,
    queryKey: ['getAllMunicipalities'],
    refetchOnWindowFocus: false,
  });
  const mutation = useMutation(
    {
      mutationFn: (args: AddRestaurantArgs) => addRestaurant(args),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['restaurants']})
      },
    },
  );
  const deleteMutation = useMutation(
    {
      mutationFn: (id: string) => deleteRestaurant(id),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['restaurants']})
      },
    },
  );

  let municipios: (Area & { zoneName: string })[] = [];
  if (municipalities) {
    // @ts-ignore
    municipios = municipalities.flatMap(zone => zone.Municipios.map(municipio => ({ ...municipio, zoneName: zone.Nombre })));
  }

  const filteredRestaurants = filterName
    ? restaurants?.filter(restaurant => restaurant.nombre.toLowerCase().includes(filterName.toLowerCase()))
    : restaurants;

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCreateRestaurant = () => {
    mutation.mutate(newRestaurant);
    handleCloseDialog();
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { checked: boolean }>) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setNewRestaurant((prev) => ({ ...prev, [field]: value }));
  };

  const handleMunicipioChange = (event: any, newValue: Area | null) => {
    setNewRestaurant({ ...newRestaurant, municipio: newValue });
  };

  if (isRestaurantsLoading || isMunicipalitiesLoading) return <CircularProgress />;
  if (isRestaurantError) return <Alert severity="error">Error: {errorRestaurant.message}</Alert>;
  if (isMunicipalitiesError) return <Alert severity="error">Error: {errorMunicipalities.message}</Alert>;

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} spacing={6}>
        <Card>
          <Grid container alignItems="center" sx={{ p: 2 }}>
            <Autocomplete
              sx={{ flexGrow: 1, mr: 2 }}
              options={restaurants?.map((restaurant) => restaurant.nombre) || []}
              renderInput={(params) => <TextField {...params} label="Buscar por nombre" />}
              value={filterName}
              onChange={(event, newValue) => setFilterName(newValue)}
              freeSolo
            />
            <Button variant="contained" color="primary" onClick={handleOpenDialog}>
              Crear Nuevo Restaurante
            </Button>
          </Grid>
          <DataGrid
            sx={{ mt: 2 }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            checkboxSelection={true}
            columns={columns}
            rows={filteredRestaurants || []}
            autoHeight={true}
          />
        </Card>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Crear Nuevo Restaurante</DialogTitle>
        <DialogContent>
          <DialogContentText>Por favor, rellena la información para crear un nuevo restaurante.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={newRestaurant.nombre}
            onChange={handleChange('nombre')}
          />
          <Autocomplete
            options={municipios}
            getOptionLabel={(option) => `${option.Nombre} (${option.zoneName})`}
            renderInput={(params) => <TextField {...params} label="Municipio" margin="dense" fullWidth />}
            value={newRestaurant.municipio}
            onChange={handleMunicipioChange}
          />
          <TextField
            margin="dense"
            label="Direccion"
            fullWidth
            value={newRestaurant.direccion}
            onChange={handleChange('direccion')}
          />
          <TextField
            margin="dense"
            label="Teléfono"
            fullWidth
            value={newRestaurant.telefono}
            onChange={handleChange('telefono')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Cancelar</Button>
          <Button onClick={handleCreateRestaurant} color="primary">Crear</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openDialogDelete} >
        <DialogTitle>Eliminar Restaurante</DialogTitle>
          <DialogContent>
            <DialogContentText>¿Estás seguro de que quieres eliminar este restaurante?</DialogContentText>
          </DialogContent>

          <DialogActions>
            <Button onClick={()=>setOpenDialogDelete(false)} color="primary">Cancelar</Button>
            <Button onClick={()=>handleDeleteRestaurant(deleteRestaurantId as string)} color="primary">Eliminar</Button>
          </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default Index;
