import React from 'react';
import { Button, Card, Grid} from "@mui/material";
import {DataGrid, esES} from "@mui/x-data-grid";
import {useQuery} from "@tanstack/react-query";
import {getAllBusiness, Restaurant} from "../../Data/obj/restaurant";
import {Cancel, Check, } from "mdi-material-ui";

function Index({}) {
  const columns = [
    {
      field: 'nombre', headerName: 'nombre', width: 300
    },
    {field: 'Municipio', headerName: 'Municipio', width: 200,renderCell: ((params: any) => {
        return (
          params.row.municipio.Nombre
        )
      })},
    {
      field: 'telefono', headerName: 'Telefono', flex: 0.4,},
    {
      field: 'Activo', headerName: 'Activo', flex: 0.4,renderCell: ((params: any) => {
        return (
          params.row.enable ? <Check color={'success'}></Check> : <Cancel color={'error'}></Cancel>
        )
      })},
    {field: 'Detalles', headerName: 'Detalles', width: 100, renderCell: ((params: any) => {
        return (
          <Button href={"/restaurantes/"+params.row.id}>Abrir</Button>
        );
    }),}
  ];

  const {data: restaurants, isLoading: isRestaurantsLoading, isError: isRestaurantError, error: errorRestaurant} = useQuery<Restaurant[], Error>({
    queryFn: getAllBusiness,
    queryKey: ['restaurants'],
    refetchOnWindowFocus: false,
  });
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} spacing={6}>
        <Card>
          <DataGrid
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            checkboxSelection={true}
            columns={columns}
            rows={restaurants!}
            autoHeight={true}
          />
        </Card>
      </Grid>
    </Grid>
  );
}

export default Index;
