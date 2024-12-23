"use client";
import React, {useState} from "react";
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
import {DataGrid, esES} from "@mui/x-data-grid";
import {useQuery} from "@tanstack/react-query";
import axios from "axios";
import {getAllBusiness, Restaurant} from "../../../Data/obj/restaurant";
import {Trophy} from "mdi-material-ui";
import {surveyOptions} from "../../../Data/obj/survey";

function SurveyResults() {
  const [surveyId, setSurveyId] = useState("1"); // Inicialmente en "1" para test
  const [categoryName, setCategoryName] = useState("Mejor-Guachinche-Tradicional");

  // Opciones para seleccionar la encuesta
  const surveyIdOptions = [
    {id: "1", label: "Test"},
    {id: "2", label: "Real"},
  ];

  // Fetch survey results
  const {data: surveyCompleted, isLoading: isLoadingSurveyCompleted, isError: isErrorSurveyCompleted} = useQuery({
    queryKey: ["surveyCount", surveyId, categoryName],
    queryFn: async () => {
      const {data} = await axios.get(
        `https://api.guachinchesmodernos.com:459/surveys/results/${surveyId}/count`
      );
      return data;
    },
  });

  // Fetch survey results
  const {data: surveyResults, isLoading, isError} = useQuery({
    queryKey: ["surveyResults", surveyId, categoryName],
    queryFn: async () => {
      const {data} = await axios.get(
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

  if (isLoading || isRestaurantsLoading) return <CircularProgress/>;
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
          <Trophy style={{color: "gold"}}/>
        ) : (
          index
        );
      },
    },
    {field: "nombre", headerName: "Nombre del Restaurante", width: 300},
    {field: "votos", headerName: "Número de Votos", width: 150},
  ];

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} spacing={2}>
        <Card>
          <h2>Total de encuestas Registradas: {surveyCompleted}</h2>
        </Card>
        <Card sx={{mt: 6}}>
          <h2>Resultados</h2>
          <Grid container alignItems="center" sx={{p: 2}} spacing={2}>
            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel>Selecciona una encuesta</InputLabel>
                <Select
                  value={surveyId}
                  label="Selecciona una encuesta"
                  onChange={(e) => setSurveyId(e.target.value)}
                >
                  {surveyIdOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Selecciona una categoría</InputLabel>
                <Select
                  value={categoryName}
                  label="Selecciona una categoría"
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
            sx={{mt: 2}}
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
