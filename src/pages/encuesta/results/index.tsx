"use client";
import React, { useState } from "react";
import {
  Grid,
  Card,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import { DataGrid, esES } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getAllBusiness, Restaurant } from "../../../Data/obj/restaurant";
import { Trophy } from "mdi-material-ui";

function SurveyResults() {
  const [surveyId, setSurveyId] = useState("1");
  const [categoryName, setCategoryName] = useState("Mejor-Guachinche");

  const surveyOptions = [
    "Mejor-Guachinche-Moderno",
    "Mejor-Guachinche-Tradicional",
    "Mejor-Restaurante",
    "Mejor-Carne-Cabra",
    "Mejor-Bocadillo",
    "Mejor-Japones",
    "Mejor-Vino",
    "Mejor-Plato-Canario",
  ];

  // Fetch survey results
  const { data: surveyResults, isLoading, isError } = useQuery({
    queryKey: ["surveyResults", surveyId, categoryName],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://api.guachinchesmodernos.com:459/surveys/results/${surveyId}/${categoryName}`
      );
      return data;
    },
  });

  // Fetch all restaurants
  const {
    data: allRestaurants,
    isLoading: isRestaurantsLoading,
    isError: isRestaurantError,
    error: errorRestaurant,
  } = useQuery<Restaurant[], Error>({
    queryFn: () => getAllBusiness(),
    queryKey: ["restaurants"],
    refetchOnWindowFocus: false,
  });

  if (isLoading || isRestaurantsLoading) return <CircularProgress />;
  if (isError || isRestaurantError)
    return <Alert severity="error">Error al cargar los resultados</Alert>;

  // Map results to include restaurant details
  const results = surveyResults
    .map((result: any) => {
      const restaurant = allRestaurants!.find((r: any) => r.id === result.option);
      if (!restaurant) {
        console.warn(
          `Datos del restaurante no encontrados para el ID: ${result.option}`
        );
      }
      return {
        id: result.option || "N/A",
        nombre: restaurant?.nombre || "Desconocido",
        votos: result.votes,
      };
    })
    .sort((a: any, b: any) => b.votos - a.votos);

  // Columnas del DataGrid
  const columns = [
    {
      field: "posicion",
      headerName: "Posición",
      width: 150,
      renderCell: (params: any) => {
        const index = results.findIndex((r: any) => r.id === params.row.id) + 1;
        return index === 1 ? (
          <Trophy style={{ color: "gold" }} />
        ) : (
          index
        );
      },
    },
    { field: "nombre", headerName: "Nombre del Restaurante", width: 300 },
    { field: "votos", headerName: "Número de Votos", width: 150 },
  ];

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <Grid container alignItems="center" sx={{ p: 2 }} spacing={2}>
            <Grid item xs={6}>
              <h2>Resultados de la Encuesta</h2>
            </Grid>
            <Grid item xs={6}>
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
          </Grid>
          <DataGrid
            sx={{ mt: 2 }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            columns={columns}
            rows={results}
            autoHeight
          />
        </Card>
      </Grid>
    </Grid>
  );
}

export default SurveyResults;
