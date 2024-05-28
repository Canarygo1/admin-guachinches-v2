import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';
import { addPhoto, AddPhotoArgs } from '../Data/obj/photo';

interface AddPhotoDialogProps {
  businessId: string;
  open: boolean;
  onClose: () => void;
}

const AddPhotoDialog: React.FC<AddPhotoDialogProps> = ({ open, onClose, businessId }) => {
  const [files, setFiles] = useState<(string | ArrayBuffer)[]>([]);
  const queryClient = useQueryClient();

  const addPhotoMutation = useMutation({
    mutationFn: (args: AddPhotoArgs) => addPhoto(args),
    onSuccess: () => {
      console.log('Photo(s) added');
      queryClient.refetchQueries({ queryKey: ['photos', businessId] });
      onClose();
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []).map((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      return new Promise<string | ArrayBuffer>((resolve) => {
        reader.onload = (e) => {
          if (e.target) {
            resolve(e.target.result as string | ArrayBuffer);
          }
        };
      });
    });

    Promise.all(newFiles).then((fileContents) => setFiles((prevFiles) => [...prevFiles, ...fileContents]));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const newFiles = Array.from(event.dataTransfer.files).map((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      return new Promise<string | ArrayBuffer>((resolve) => {
        reader.onload = (e) => {
          if (e.target) {
            resolve(e.target.result as string | ArrayBuffer);
          }
        };
      });
    });

    Promise.all(newFiles).then((fileContents) => setFiles((prevFiles) => [...prevFiles, ...fileContents]));
  };

  const handleAddPhoto = () => {
    files.forEach((file) => {
      if (typeof file === 'string') {
        addPhotoMutation.mutate({ businessId, photo: file });
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={'md'} fullWidth={true}>
      <DialogTitle>Añadir Fotos</DialogTitle>
      <DialogContent
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ border: '2px dashed gray', padding: '10px', textAlign: 'center', minHeight:'200px' }}
      >
        <p>Arrastra y suelta las fotos aquí o</p>
        <input type="file" onChange={handleFileChange} multiple />
        <div>
          {files.length > 0 && (
            <div style={{ display: 'flex', justifyContent:'center',flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {files.map((file, index) => (
                <div key={index} style={{ width: '100px', height: '100px', overflow: 'hidden' }}>
                  <img src={file as string} alt={`Foto ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleAddPhoto} color="primary" disabled={addPhotoMutation.isPending}>
          {addPhotoMutation.isPending ? <CircularProgress size={24} /> : 'Añadir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPhotoDialog;
