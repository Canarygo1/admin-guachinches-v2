import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { DataGrid, esES } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addRestaurant, AddRestaurantArgs, deleteRestaurant, getAllBusinesByIsland, Restaurant } from "../../Data/obj/restaurant";
import { Cancel, Check } from "mdi-material-ui";
import Autocomplete from '@mui/material/Autocomplete';
import { getAllMunicipalitiesByIsland } from "../../Data/obj/municipality";
import axios from "axios";

function Index() {
  const [filterName, setFilterName] = useState<string | null>(null);
  const [filterIsland, setFilterIsland] = useState<string>("76ac0bec-4bc1-41a5-bc60-e528e0c12f4d");
  const [openDialog, setOpenDialog] = useState(false);
  const [openDialogDelete, setOpenDialogDelete] = useState(false);
  const [deleteRestaurantId, setDeleteRestaurantId] = useState<string | null>(null);
  const [dialogIslandFilter, setDialogIslandFilter] = useState<string>("76ac0bec-4bc1-41a5-bc60-e528e0c12f4d"); // Filtro de isla en el diálogo
  const queryClient = useQueryClient();
  const [newRestaurant, setNewRestaurant] = useState<AddRestaurantArgs>({
    nombre: '',
    municipio: null,
    telefono: '',
    direccion: '',
  });

  // Encuestas disponibles
  const surveyOptions = [
    "Mejor-Guachinche-Moderno",
    "Mejor-Guachinche-Tradicional",
    "Mejor-Restaurante",
    "Mejor-Carne-Cabra",
    "Mejor-Japones",
    "Mejor-Vino",
    "Mejor-Plato-Canario",
  ];

  // Estado para las encuestas seleccionadas
  const [selectedSurveys, setSelectedSurveys] = useState<string[]>([]);

  // Limpia el filtro por nombre al cambiar de isla
  useEffect(() => {
    setFilterName(null);
  }, [filterIsland]);

  const { data: restaurants, isLoading: isRestaurantsLoading, isError: isRestaurantError, error: errorRestaurant } = useQuery<Restaurant[], Error>({
    queryFn: () => getAllBusinesByIsland(filterIsland),
    queryKey: ['restaurants', filterIsland],
    refetchOnWindowFocus: false,
  });

  const { data: municipalities, isLoading: isMunicipalitiesLoading, isError: isMunicipalitiesError, error: errorMunicipalities } = useQuery({
    queryFn: () => getAllMunicipalitiesByIsland(dialogIslandFilter),
    queryKey: ['municipalities', dialogIslandFilter],
    refetchOnWindowFocus: false,
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurant: AddRestaurantArgs) => {
      const response = await addRestaurant(restaurant);
      return response.id; // Devuelve el ID del restaurante creado
    },
    onSuccess: async (restaurantId) => {
      // Asignar el restaurante a las encuestas seleccionadas
      await Promise.all(
        selectedSurveys.map((survey) =>
          axios.post("https://api.guachinchesmodernos.com:459/category-restaurants/assign", {
            survey_schema_id: "1", // Ajusta este valor según tu lógica de esquema de encuesta
            category_name: survey,
            restaurant_id: restaurantId,
          })
        )
      );
      queryClient.refetchQueries(["restaurants"]);
      setOpenDialog(false);
      setSelectedSurveys([]);
      setNewRestaurant({
        nombre: '',
        municipio: null,
        telefono: '',
        direccion: '',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRestaurant(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['restaurants'] });
    },
  });

  // Procesa municipios basados en la nueva estructura
  const municipios = municipalities?.map((municipio: any) => ({
    ...municipio,
    areaName: municipio.areas?.Nombre || 'Sin Área',
    islandId: municipio.areas?.islands_id || '',
  })) || [];

  // Filtra los municipios según la isla seleccionada en el diálogo
  const filteredDialogMunicipalities = municipios.filter(municipio => municipio.islandId === dialogIslandFilter);

  const islands = [
    { label: 'Tenerife', value: '76ac0bec-4bc1-41a5-bc60-e528e0c12f4d' },
    { label: 'Gran Canaria', value: '6f91d60f-0996-4dde-9088-167aab83a21a' },
  ];

  const filteredRestaurants = restaurants?.filter((restaurant: any) => {
    const matchesName = filterName ? restaurant.nombre.toLowerCase().includes(filterName.toLowerCase()) : true;
    return matchesName;
  });

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  const handleCreateRestaurant = () => {
    createRestaurantMutation.mutate(newRestaurant);
  };

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewRestaurant({ ...newRestaurant, [field]: event.target.value });
  };

  const handleMunicipioChange = (event: any, newValue: any) => {
    setNewRestaurant({ ...newRestaurant, municipio: newValue });
  };

  const handleSurveySelection = (event: React.ChangeEvent<HTMLInputElement>, survey: string) => {
    setSelectedSurveys((prev) =>
      event.target.checked ? [...prev, survey] : prev.filter((s) => s !== survey)
    );
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
            <Autocomplete
              sx={{ width: 200, mr: 2 }}
              options={islands}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => <TextField {...params} label="Filtrar por isla" />}
              value={islands.find((island) => island.value === filterIsland)}
              onChange={(event, newValue) => setFilterIsland(newValue?.value as string)}
              disableClearable
            />
            <Button variant="contained" color="primary" onClick={handleOpenDialog}>
              Crear Nuevo Restaurante
            </Button>
          </Grid>
          <DataGrid
            sx={{ mt: 2 }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            checkboxSelection
            columns={[
              { field: 'nombre', headerName: 'Nombre', width: 300 },
              { field: 'Municipio', headerName: 'Municipio', width: 200, renderCell: (params) => params.row.municipios.Nombre },
              { field: 'telefono', headerName: 'Teléfono', flex: 0.4 },
              { field: 'Activo', headerName: 'Activo', flex: 0.4, renderCell: (params) => (params.row.enable ? <Check color="success" /> : <Cancel color="error" />) },
              { field: 'Detalles', headerName: 'Detalles', width: 100, renderCell: (params) => <Button href={`/restaurantes/${params.row.id}`}>Abrir</Button> },
              { field: 'Borrar', headerName: 'Borrar', width: 100, renderCell: (params) => <Button onClick={() => deleteMutation.mutate(params.row.id)}>Borrar</Button> },
            ]}
            rows={filteredRestaurants || []}
            autoHeight
          />
        </Card>
      </Grid>

      {/* Dialogo para crear nuevo restaurante */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Crear Nuevo Restaurante</DialogTitle>
        <DialogContent>
          <DialogContentText>Por favor, selecciona la isla, municipio y encuestas para asociar el restaurante.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={newRestaurant.nombre}
            onChange={handleChange('nombre')}
          />
          <Autocomplete
            options={islands}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => <TextField {...params} label="Filtrar por isla" />}
            value={islands.find((island) => island.value === dialogIslandFilter)}
            onChange={(event, newValue) => setDialogIslandFilter(newValue?.value as string)}
            disableClearable
          />
          <Autocomplete
            options={filteredDialogMunicipalities}
            getOptionLabel={(option) => `${option.Nombre} (${option.areaName})`}
            renderInput={(params) => <TextField {...params} label="Municipio" margin="dense" fullWidth />}
            value={newRestaurant.municipio}
            onChange={handleMunicipioChange}
          />
          <TextField
            margin="dense"
            label="Dirección"
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
          <Grid container>
            {surveyOptions.map((survey) => (
              <Grid item xs={12} key={survey}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedSurveys.includes(survey)}
                      onChange={(event) => handleSurveySelection(event, survey)}
                    />
                  }
                  label={survey.replace(/-/g, " ")}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Cancelar</Button>
          <Button onClick={handleCreateRestaurant} color="primary" disabled={createRestaurantMutation.isPending}>
            {createRestaurantMutation.isPending ? "Creando..." : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default Index;
