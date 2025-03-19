"use client";
import React, { useState } from "react";
import {
  Button,
  Card,
  Grid,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  TextField,
} from "@mui/material";
import { DataGrid, esES } from "@mui/x-data-grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getAllBusiness } from "src/Data/obj/restaurant";
import { getRestaurantsBySurvey } from "../../Data/obj/restaurant";
import { surveyOptions } from "src/Data/obj/survey";

function SurveyRestaurants() {
  const queryClient = useQueryClient();
  const [surveyId] = useState("1");
  const [categoryName, setCategoryName] = useState("Mejor-Guachinche-Moderno");
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);

  // Obtener restaurantes asociados a la encuesta seleccionada
  const { data: restaurants, isLoading, isError, error } = useQuery({
    queryKey: ["surveyRestaurants", surveyId, categoryName],
    queryFn: () => getRestaurantsBySurvey(surveyId, categoryName),
    refetchOnWindowFocus: false,
  });

  // Obtener todos los restaurantes
  const { data: allRestaurants, isLoading: isAllLoading } = useQuery({
    queryKey: ["allRestaurants"],
    queryFn: getAllBusiness,
    refetchOnWindowFocus: false,
  });

  // Filtrar restaurantes que ya han sido añadidos
  const availableRestaurants = allRestaurants?.filter(
    (restaurant) => !restaurants?.some((r:any) => r.restaurant.id === restaurant.id)
  );

  // Mutación para asignar un restaurante a la encuesta
  const assignRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      await axios.post("https://api.guachinchesmodernos.com:459/category-restaurants/assign", {
        survey_schema_id: surveyId,
        category_name: categoryName,
        restaurant_id: restaurantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["surveyRestaurants", surveyId, categoryName],
      });
      setOpenAddDialog(false);
      setSelectedRestaurant(null);
    },
  });

  // Mutación para eliminar un restaurante de la encuesta
  const deleteRestaurantMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`https://api.guachinchesmodernos.com:459/category-restaurants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["surveyRestaurants", surveyId, categoryName],
      });
    },
  });

  // Preparar las filas para el DataGrid
  const rows =
    restaurants?.map((item: any) => ({
      id: item.id,
      restaurant: item.restaurant,
    })) || [];

  // Columnas del DataGrid
  const columns = [
    { field: "nombre", headerName: "Nombre", width: 300, renderCell: (params: any) => params.row.restaurant?.nombre },
    { field: "direccion", headerName: "Dirección", width: 300, renderCell: (params: any) => params.row.restaurant?.direccion },
    { field: "telefono", headerName: "Teléfono", width: 150, renderCell: (params: any) => params.row.restaurant?.telefono },
    { field: "horarios", headerName: "Horarios", width: 250, renderCell: (params: any) => params.row.restaurant?.horarios || "No disponible" },
    { field: "activo", headerName: "Activo", width: 100, renderCell: (params: any) => (params.row.restaurant?.enable ? "Sí" : "No") },
    {
      field: "eliminar",
      headerName: "Eliminar",
      width: 100,
      renderCell: (params: any) => (
        <Button
          color="secondary"
          onClick={() => deleteRestaurantMutation.mutate(params.row.id)}
          disabled={deleteRestaurantMutation.isPending}
        >
          {deleteRestaurantMutation.isPending ? "Eliminando..." : "Eliminar"}
        </Button>
      ),
    },
  ];

  // Manejo de diálogo para añadir restaurantes
  const handleOpenAddDialog = () => setOpenAddDialog(true);
  const handleCloseAddDialog = () => setOpenAddDialog(false);
  const handleAddRestaurant = () => {
    if (selectedRestaurant) {
      assignRestaurantMutation.mutate(selectedRestaurant);
    }
  };

  // Mostrar cargando o errores
  if (isLoading || isAllLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Error: {error.message}</Alert>;

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <Grid container alignItems="center" sx={{ p: 2 }} spacing={2}>
            <Grid item xs={6}>
              <h2>Restaurantes Asociados a la Encuesta</h2>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Selecciona una encuesta</InputLabel>
                <Select
                  value={categoryName}
                  label="Selecciona una encuesta"
                  onChange={(e) => setCategoryName(e.target.value)}
                >
                  {surveyOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option.replace(/-/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <Button variant="contained" color="primary" size={'medium'} onClick={handleOpenAddDialog}>
                Añadir Restaurante
              </Button>
            </Grid>
          </Grid>
          <DataGrid
            sx={{ mt: 2 }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            columns={columns}
            rows={rows}
            autoHeight
          />
        </Card>
      </Grid>

      <Dialog maxWidth={'md'} fullWidth open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Añadir Restaurante</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={availableRestaurants || []}
            getOptionLabel={(option: any) => option.nombre}
            onChange={(event, newValue) => setSelectedRestaurant(newValue?.id || null)}
            renderInput={(params) => <TextField {...params} label="Selecciona un restaurante" margin="dense" fullWidth />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="secondary">Cancelar</Button>
          <Button onClick={handleAddRestaurant} color="primary" disabled={!selectedRestaurant || assignRestaurantMutation.isPending}>
            {assignRestaurantMutation.isPending ? "Añadiendo..." : "Añadir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default SurveyRestaurants;
