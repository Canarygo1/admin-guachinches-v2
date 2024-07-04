import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, IconButton, Button, Grid, CircularProgress, Alert, Avatar, Box, Typography, Menu, MenuItem } from '@mui/material';

import { AddPhotoArgs, DeletePhotoArgs, deleteRestaurantPhoto, getAllPhotos, Photo } from "../Data/obj/photo";
import AddPhotoDialog from "./AddPhotoDialog";
import {DotsGrid, DotsVerticalCircle, More} from "mdi-material-ui";
import {updatePhotoType} from "../Data/obj/restaurant"; // Este será el componente para añadir fotos

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
        queryClient.refetchQueries({ queryKey: ['photos', restaurantId] });
      },
    },
  );

  const updatePhotoTypeMutation = useMutation(
    {
      mutationFn: (args: { businessId: string, photoId: string}) => updatePhotoType(args.businessId,args.photoId),
      onSuccess: () => {
        console.log('Photo type updated');
        queryClient.refetchQueries({ queryKey: ['photos', restaurantId] });
      },
    },
  );

  const handleDeletePhoto = (photoId: string) => {
    deletePhotoMutation.mutate({ businessId: restaurantId, photoId });
  };

  const handleMakePrimary = (photoId: string) => {
    updatePhotoTypeMutation.mutate({ businessId: restaurantId, photoId });
  };

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedPhotoId, setSelectedPhotoId] = React.useState<string | null>(null);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, photoId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPhotoId(photoId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPhotoId(null);
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
              {photo.type === 'principal' && (
                <Typography
                  variant="caption"
                  color="white"
                  bgcolor="primary.main"
                  sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1, padding: '2px 4px', borderRadius: '4px' }}
                >
                  Principal
                </Typography>
              )}
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
                onClick={(event) => handleMenuOpen(event, photo.id)}
                color="inherit"
                sx={{ position: 'absolute', top: 0, right: 0 }}
              >
                <DotsVerticalCircle />
              </IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMakePrimary(selectedPhotoId as string);
          handleMenuClose();
        }}>
          Hacer Principal
        </MenuItem>
        <MenuItem onClick={() => {
          handleDeletePhoto(selectedPhotoId as string);
          handleMenuClose();
        }}>
          Borrar
        </MenuItem>
      </Menu>
      <AddPhotoDialog open={isDialogOpen} onClose={handleCloseDialog} businessId={restaurantId} />
    </Card>
  );
};

export default PhotoGallery;
