import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  CircularProgress,
  Box
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {AddVideoArgs, uploadVideo} from "../Data/obj/video";

export interface VideoUploadDialogProps {
  open: boolean;
  handleClose: () => void;
  restaurantId: string;
}

const VideoUploadDialog = ({ open, handleClose, restaurantId }:VideoUploadDialogProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);


  const mutation = useMutation({
    mutationFn: (args: AddVideoArgs) => uploadVideo(args),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['videos', restaurantId] });
      handleClose();
    },
  });

  const handleFileChange = (event:any) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (file && title) {
      mutation.mutate({ restaurantId, file, title });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Upload Video</DialogTitle>
      <DialogContent>
        <Box component="form" noValidate autoComplete="off">
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="normal"
          />
          <input type="file" accept="video/mp4" onChange={handleFileChange} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="secondary">Cancel</Button>
        <Button onClick={handleUpload} color="primary" disabled={mutation.isPending}>
          {mutation.isPending ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoUploadDialog;
