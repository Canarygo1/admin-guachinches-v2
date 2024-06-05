import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, IconButton } from '@mui/material';
import { addPhoto, AddPhotoArgs } from '../Data/obj/photo';
import {Delete, DeleteCircle} from "mdi-material-ui";

interface AddPhotoDialogProps {
  businessId: string;
  open: boolean;
  onClose: () => void;
}

const AddPhotoDialog: React.FC<AddPhotoDialogProps> = ({ open, onClose, businessId }) => {
  const [files, setFiles] = useState<(string | ArrayBuffer)[]>([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const addPhotoMutation = useMutation({
    mutationFn: (args: AddPhotoArgs) => addPhoto(args),
    onSuccess: () => {
      console.log('Photo(s) added');
      queryClient.refetchQueries({ queryKey: ['photos', businessId] });
      setFiles([]);
      onClose();
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const heic2any = require('heic2any');
      const newFiles = Array.from(event.target.files || []).map(async (file) => {
        if (file.type === 'image/heic') {
          return heic2any({ blob: file, toType: 'image/jpeg' })
            .then((convertedBlob: any) => {
              return new Promise<string | ArrayBuffer>((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(convertedBlob as Blob);
                reader.onload = (e) => {
                  if (e.target) {
                    resolve(e.target.result as string | ArrayBuffer);
                  }
                };
              });
            });
        } else {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          return new Promise<string | ArrayBuffer>((resolve) => {
            reader.onload = (e) => {
              if (e.target) {
                resolve(e.target.result as string | ArrayBuffer);
              }
            };
          });
        }
      });
      const fileContents = await Promise.all(newFiles);
      setFiles((prevFiles) => [...prevFiles, ...fileContents]);
      setLoading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setLoading(true);
    const newFiles = Array.from(event.dataTransfer.files).map(async (file) => {
      if (file.type === 'image/heic') {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const heic2any = require('heic2any');
          return heic2any({ blob: file, toType: 'image/jpeg' })
            .then((convertedBlob: any) => {
              return new Promise<string | ArrayBuffer>((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(convertedBlob as Blob);
                reader.onload = (e) => {
                  if (e.target) {
                    resolve(e.target.result as string | ArrayBuffer);
                  }
                };
              });
            });
        }
      } else {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        return new Promise<string | ArrayBuffer>((resolve) => {
          reader.onload = (e) => {
            if (e.target) {
              resolve(e.target.result as string | ArrayBuffer);
            }
          };
        });
      }
    });

    const fileContents = await Promise.all(newFiles);
    setFiles((prevFiles) => [...prevFiles, ...fileContents]);
    setLoading(false);
  };

  const handleAddPhoto = () => {
    files.forEach((file) => {
      if (typeof file === 'string') {
        addPhotoMutation.mutate({ businessId, photo: file });
      }
    });
  };

  const handleRemovePhoto = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={'md'} fullWidth={true}>
      <DialogTitle>Añadir Fotos</DialogTitle>
      <DialogContent
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ border: '2px dashed gray', padding: '10px', textAlign: 'center', minHeight: '200px' }}
      >
        <p>Arrastra y suelta las fotos aquí o</p>
        <input type="file" onChange={handleFileChange} multiple />
        <div>
          {loading ? (
            <CircularProgress />
          ) : (
            files.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {files.map((file, index) => (
                  <div key={index} style={{ position: 'relative', width: '100px', height: '100px', overflow: 'hidden' }}>
                    <img src={file as string} alt={`Foto ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton
                      onClick={() => handleRemovePhoto(index)}
                      style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                    >
                     <Delete color={'error'}/>
                    </IconButton>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleAddPhoto} color="primary" disabled={addPhotoMutation.isPending || files.length === 0}>
          {addPhotoMutation.isPending ? <CircularProgress size={24} /> : 'Añadir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPhotoDialog;
