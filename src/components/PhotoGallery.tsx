import React from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import { Card, CardHeader, IconButton, Button, Grid, CircularProgress, Alert, Avatar, Box } from '@mui/material';
import { Delete } from 'mdi-material-ui';
import {AddPhotoArgs, DeletePhotoArgs, deleteRestaurantPhoto, getAllPhotos, Photo} from "../Data/obj/photo";
import AddPhotoDialog from "./AddPhotoDialog"; // Este será el componente para añadir fotos

const PhotoGallery = ({ restaurantId }: { restaurantId: string }) => {
  const queryClient = useQueryClient();
  const { data: photos, isLoading, isError, error } = useQuery<Photo[], Error>({
    queryFn: () => getAllPhotos(restaurantId as string),
    queryKey: ['photos', restaurantId],
    refetchOnWindowFocus: false,
  });

  const deletePhotoMutation = useMutation(
    {
      mutationFn: (args: DeletePhotoArgs) => deleteRestaurantPhoto(args),
      onSuccess: () => {
        console.log('Photo deleted');
        queryClient.refetchQueries({ queryKey: ['photos']})
      },
    },
  );

  const handleDeletePhoto = (photoId:string) => {
    deletePhotoMutation.mutate({ businessId:restaurantId, photoId });
  };

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Error: {error.message}</Alert>;

  return (
    <Card>
      <CardHeader
        title="Fotos del Negocio"
        action={
          <Button variant="contained" color="primary" onClick={handleOpenDialog}>
            Añadir Foto
          </Button>
        }
      />
      <Grid container spacing={2} padding={2}>
        {photos && photos.map((photo) => (
          <Grid item xs={6} md={2} key={photo.id}>
            <Box position="relative" sx={{ width: '100%', paddingBottom: '100%' }}>
              <Avatar
                src={photo.photoUrl}
                variant="square"
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
              <IconButton
                onClick={() => {
                  handleDeletePhoto(photo.id);
                }}
                color="error"
                sx={{ position: 'absolute', top: 0, right: 0 }}
              >
                <Delete />
              </IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>
      <AddPhotoDialog open={isDialogOpen} onClose={handleCloseDialog} businessId={restaurantId} />
    </Card>
  );
};

export default PhotoGallery;
