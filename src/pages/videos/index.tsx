import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Avatar, Card, Grid, CardHeader, Button } from '@mui/material';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {AddVideoArgs, deleteRestaurantVideo, getAllVideos, uploadVideo, Video} from '../../Data/obj/video';
import { getAllBusiness, Restaurant } from '../../Data/obj/restaurant';
import VideoAddUploadDialog from "../../components/addVideoDialog";


function Videos() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: restaurants, isLoading: isRestaurantsLoading, isError: isRestaurantError, error: errorRestaurant } = useQuery<Restaurant[], Error>({
    queryFn: getAllBusiness,
    queryKey: ['restaurants'],
    refetchOnWindowFocus: false,
  });
  const mutationDelete = useMutation({
    mutationFn: (videoId:string) => deleteRestaurantVideo({videoId}),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['videos'] });
      handleClose();
    },
  });

  const { data: videos, isLoading, isError, error } = useQuery<Video[], Error>({
    queryFn: () => getAllVideos(),
    queryKey: ['videos'],
    refetchOnWindowFocus: false,
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const columns = [
    {
      field: 'thumbnail',
      headerName: 'Miniatura',
      width: 300,
      renderCell: (params: any) => (
        <Avatar variant="square" src={params.value} alt={params.row.title} style={{ width: 60, height: 100 }} />
      ),
    },
    {
      field: 'name',
      headerName: 'Titulo',
      flex: 0.5,
    },
    {
      field: 'restaurant',
      headerName: 'Restaurant',
      width: 200,
      flex: 0.5,
      renderCell: (params: any) => (
        <Typography variant="body2" color="textSecondary">{params.value.nombre}</Typography>
      ),
    },
    {
      field: 'delete',
      headerName: 'Borrar',
      width: 100,
      renderCell: (params: any) => (
        <Button onClick={() => handleDeleteVideo(params.row.id)}>Borrar</Button>
      ),
    }
  ];
  const handleDeleteVideo = (id:string) => {
    mutationDelete.mutate(id);
  }
  return (
    <Grid>
      <Card>
        <CardHeader title="Videos" action={<Button onClick={handleOpen} variant="contained" color="primary">Crear Video</Button>} />
        <Box sx={{ width: '100%' }}>
          <DataGrid
            autoHeight
            rows={videos as Video[]}
            columns={columns}
            pageSize={10}
          />
        </Box>
      </Card>
      {restaurants && (
        <VideoAddUploadDialog open={open} restaurants={restaurants} handleClose={handleClose} />
      )}
    </Grid>
  );
}

export default Videos;
