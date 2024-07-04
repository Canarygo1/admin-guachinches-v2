import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  CircularProgress,
  Box, Grid, Select, MenuItem, Autocomplete
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {Restaurant} from "../Data/obj/restaurant";
import {AddVideoArgs, uploadVideo} from "../Data/obj/video";

export interface VideoUploadDialogDataGridProps {
  open: boolean;
  handleClose: () => void;
  restaurants: Restaurant[];

}

const VideoAddUploadDialog = ({ open, handleClose,restaurants }: VideoUploadDialogDataGridProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [restaurantId, setRestaurantId] = useState('');

  const handleRestaurantChange = (event:any, value:any) => {
    setRestaurantId(value ? value.id : null);
  };


  const mutation = useMutation({
    mutationFn: (args: AddVideoArgs) => uploadVideo(args),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['videos'] });
      handleClose();
    }
  });

  const handleFileChange = (event: any) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);

    // Capturar el primer frame del video
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      const videoElement = videoRef.current! as HTMLVideoElement;
      videoElement.src = url;

      videoElement.onloadeddata = () => {
        videoElement.currentTime = 0;
      };

      videoElement.onseeked = () => {
        const canvasElement = canvasRef.current! as  HTMLCanvasElement ;
        const context = canvasElement.getContext('2d');

        // Configurar el tamaño del canvas para ser vertical (e.g., 720x1280)
        const aspectRatio = 9 / 16; // Aspect ratio for vertical video (e.g., 1080x1920)
        canvasElement.width = 720;
        canvasElement.height = canvasElement.width / aspectRatio;

        // Calcular el ancho y alto del video en el canvas para centrarlo y mantener la proporción
        const scale = canvasElement.width / videoElement.videoWidth;
        const scaledHeight = videoElement.videoHeight * scale;

        // Dibujar el video en el canvas centrado verticalmente
        context!.drawImage(
          videoElement,
          0,
          (canvasElement.height - scaledHeight) / 2,
          canvasElement.width,
          scaledHeight
        );

        const thumbnailDataUrl = canvasElement.toDataURL('image/jpeg');
        setThumbnail(thumbnailDataUrl);
        URL.revokeObjectURL(url);  // Limpiar el objeto URL
      };
    }
  };

  const handleUpload = () => {
    if (file && title && thumbnail) {
      mutation.mutate({ restaurantId, file, title, thumbnail });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={'sm'} fullWidth={true} >
      <DialogTitle>Añadir Video</DialogTitle>
      <DialogContent>
        <Box component="form" noValidate autoComplete="off">
          <TextField
            label="Titulo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              options={restaurants}
              getOptionLabel={(option) => option.nombre}
              renderInput={(params) => <TextField {...params} label="Seleccionar restaurante" />}
              onChange={handleRestaurantChange}
            />
          </Grid>
          <input type="file" accept="video/mp4" onChange={handleFileChange} />
        </Box>
        <video ref={videoRef} style={{ display: 'none' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Cancelar</Button>
        <Button onClick={handleUpload} color="primary" disabled={mutation.isPending}>
          {mutation.isPending ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoAddUploadDialog;
