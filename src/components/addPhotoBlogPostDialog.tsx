import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, IconButton } from '@mui/material';
import { Delete } from "mdi-material-ui";
import {AddPhotoBlogPostArgs, updateBlogPostPhoto} from "../Data/obj/blogPost";

interface AddPhotoDialogProps {
  blogPostId: string;
  open: boolean;
  onClose: () => void;
}

const AddBlogPostPhotoDialog: React.FC<AddPhotoDialogProps> = ({ open, onClose, blogPostId }) => {
  const [file, setFile] = useState<string | ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const addPhotoMutation = useMutation({
    mutationFn: (args: AddPhotoBlogPostArgs) => updateBlogPostPhoto(args),
    onSuccess: () => {
      console.log('Photo added');
      queryClient.refetchQueries({ queryKey: ['blogPostDetails', blogPostId] });
      setFile(null);
      onClose();
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const heic2any = require('heic2any');
      const newFile = Array.from(event.target.files || []).map(async (file) => {
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

      const fileContents = await Promise.all(newFile);
      setFile(fileContents[0]);
      setLoading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setLoading(true);
    const newFile = Array.from(event.dataTransfer.files).map(async (file) => {
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

    const fileContents = await Promise.all(newFile);
    setFile(fileContents[0]);
    setLoading(false);
  };

  const handleAddPhoto = () => {
    if (typeof file === 'string') {
      addPhotoMutation.mutate({ blogPostId, photo: file });
    }
  };

  const handleRemovePhoto = () => {
    setFile(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth={'md'} fullWidth={true}>
      <DialogTitle>Añadir Foto</DialogTitle>
      <DialogContent
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ border: '2px dashed gray', padding: '10px', textAlign: 'center', minHeight: '200px' }}
      >
        <p>Arrastra y suelta la foto aquí o</p>
        <input type="file" onChange={handleFileChange} />
        <div>
          {loading ? (
            <CircularProgress />
          ) : (
            file && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', overflow: 'hidden' }}>
                  <img src={file as string} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton
                    onClick={handleRemovePhoto}
                    style={{ position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <Delete color={'error'} />
                  </IconButton>
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleAddPhoto} color="primary" disabled={addPhotoMutation.isPending || !file}>
          {addPhotoMutation.isPending ? <CircularProgress size={24} /> : 'Añadir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBlogPostPhotoDialog;
