import React, { useState } from 'react';
import { Button, Card, Grid, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Alert } from "@mui/material";
import { DataGrid, esES } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {addBlogPost, AddBlogPost, deleteBlogPost} from "../../Data/obj/blogPost";
import Autocomplete from '@mui/material/Autocomplete';
import { getAllBlogPosts, BlogPost } from "../../Data/obj/blogPost";
import {useRouter} from "next/router";

function Index() {
  const [filterName, setFilterName] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteBlogPostId, setDeleteBlogPostId] = useState('');
  const queryClient = useQueryClient();
  const [newBlogPost, setNewBlogPost] = useState<AddBlogPost>({
    title: '',
    subTitle: '',
    photo: '',
    restaurantIds: [],
    size: '',
  });

  const columns = [
    { field: 'photo', headerName: 'Foto', width: 64, renderCell: (params: any) => <img src={params.row.photo_url} style={{ width: 50, height: 50 }} /> },
    { field: 'title', headerName: 'Nombre', width: 300 },
    { field: 'subTitle', headerName: 'Subtitulo', width: 400 },
    { field: 'restaurantIds', headerName: 'Restaurantes', width: 200, renderCell: (params: any) => params.row.restaurants.length },
    { field: 'edit', headerName: 'Editar', width: 100, renderCell: (params: any) => <Button href={'/blogPost/'+params.row.id}>Editar</Button> },
    { field: 'delete', headerName: 'Eliminar', width: 100, renderCell: (params: any) => <Button onClick={()=>{
      setDeleteBlogPostId(params.row.id)
      setDeleteDialog(true)
      }}>Eliminar</Button> },
  ];

  const { data: blogPosts, isLoading: isBlogPostLoading, isError: isBlogPostError, error: errorBlogPost } = useQuery<BlogPost[], Error>({
    queryFn: getAllBlogPosts,
    queryKey: ['blogPosts'],
    refetchOnWindowFocus: false,
  });
  const router = useRouter()
  const handleDeleteBlogPost = (id:string)=>{
    deleteMutation.mutate(id)
  }
  const mutation = useMutation({
    mutationFn: (args: AddBlogPost) => addBlogPost(args),
    onSuccess: (data:any) => {
      queryClient.refetchQueries({ queryKey: ['blogPosts'] });
      router.push('/blogPost/'+data.Id)
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id:string) => deleteBlogPost(id),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['blogPosts'] });
      setDeleteDialog(false)
    },
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (field: keyof AddBlogPost) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewBlogPost({ ...newBlogPost, [field]: event.target.value });
  };

  const handleCreateBlogPost = () => {
    mutation.mutate(newBlogPost);
  };

  if (isBlogPostLoading) return <CircularProgress />;
  if (isBlogPostError) return <Alert severity="error">Error: {errorBlogPost.message}</Alert>;

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} spacing={6}>
        <Card>
          <Grid container alignItems="center" sx={{ p: 2 }}>
            <Autocomplete
              sx={{ flexGrow: 1, mr: 2 }}
              options={blogPosts?.map((blogPost) => blogPost.title) || []}
              renderInput={(params) => <TextField {...params} label="Buscar por nombre" />}
              value={filterName}
              onChange={(event, newValue) => setFilterName(newValue)}
              freeSolo
            />
            <Button variant="contained" color="primary" onClick={handleOpenDialog}>
              Crear Nuevo Blog Post
            </Button>
          </Grid>
          <DataGrid
            sx={{ mt: 2 }}
            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
            checkboxSelection={true}
            columns={columns}
            rows={blogPosts || []}
            autoHeight={true}
          />
        </Card>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Crear un nuevo blog post</DialogTitle>
        <DialogContent>
          <DialogContentText>Por favor, dale un titulo y a continuación rellana la info.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Título"
            fullWidth
            value={newBlogPost.title}
            onChange={handleChange('title')}
          />

          {/*<Autocomplete*/}
          {/*  multiple*/}
          {/*  options={[]} // You need to provide options for restaurant IDs here*/}
          {/*  getOptionLabel={(option) => option.name} // Adjust this based on your data structure*/}
          {/*  renderInput={(params) => <TextField {...params} label="Restaurantes" margin="dense" fullWidth />}*/}
          {/*  value={newBlogPost.restaurantIds}*/}
          {/*  onChange={(event, newValue) => setNewBlogPost({ ...newBlogPost, restaurantIds: newValue })}*/}
          {/*/>*/}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">Cancelar</Button>
          <Button onClick={handleCreateBlogPost} color="primary">Crear</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={deleteDialog}>
        <DialogTitle>Estas seguro que quieres eliminar este blogPost</DialogTitle>
        <DialogActions>
          <Button onClick={()=>{
            setDeleteDialog(false)
          }} color="primary">Cancelar</Button>
          <Button onClick={()=>handleDeleteBlogPost(deleteBlogPostId)} color="primary">Eliminar</Button>
        </DialogActions>
      </Dialog>

    </Grid>
  );
}

export default Index;
