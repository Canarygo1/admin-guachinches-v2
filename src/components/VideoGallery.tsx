// src/components/VideoGallery.tsx
import React, { useState } from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
  Grid,
  CircularProgress,
  Alert,
  Button,
  Box,
  Typography,
  Card,
  CardHeader,
  IconButton,
} from '@mui/material';
import {deleteRestaurantVideo, DeleteVideoArgs, getAllVideos, Video} from '../Data/obj/video';
import VideoUploadDialog from './VideoUploadDialog';
import {Delete} from "mdi-material-ui";

const VideoGallery = ({ restaurantId }: { restaurantId: string }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: videos, isLoading, isError, error } = useQuery<Video[], Error>({
    queryFn: () => getAllVideos(restaurantId as string),
    queryKey: ['videos', restaurantId],
    refetchOnWindowFocus: false,
  });

  const deleteVideoMutation = useMutation(
    {
      mutationFn: (args: DeleteVideoArgs) => deleteRestaurantVideo(args),
      onSuccess: () => {
        console.log('video deleted');
        queryClient.refetchQueries({ queryKey: ['videos']})
      },
    },
  );

  const handleDelete = (id: string) => {
    deleteVideoMutation.mutate({videoId:id});
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  if (isLoading) return <CircularProgress />;
  if (isError) return <Alert severity="error">Error: {error.message}</Alert>;

  return (
    <Card>
      <CardHeader
        title="Galería de Videos"
        action={
          <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mt: 2 }}>
            Añadir Video
          </Button>
        }
      />
      <Grid container spacing={2} style={{ padding: 8 }}>
        {videos && videos.map((video: Video) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
            <Box>
              <video width="100%" height="200" controls style={{ objectFit: 'cover' }}>
                <source src={video.url_video} type="video/mp4" />
                Tu navegador no soporta la etiqueta de video.
              </video>
              <Typography variant="caption">{video.name}</Typography>
              <IconButton
                aria-label="delete"
                onClick={() => handleDelete(video.id)}
                color="secondary"
              >
                <Delete />
              </IconButton>
            </Box>
          </Grid>
        ))}
      </Grid>
      <VideoUploadDialog open={open} handleClose={handleClose} restaurantId={restaurantId} />
    </Card>
  );
};

export default VideoGallery;
