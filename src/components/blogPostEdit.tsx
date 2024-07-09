import React, { useEffect, useState } from 'react';
import {
  Button,
  Grid,
  TextField,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  MenuItem,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete
} from "@mui/material";
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  AddBlogPost,
  AddBlogPostRestaurant,
  addResraurantToBlogPost,
  BlogPost,
  getBlogPostById, updateBlogPost
} from "../Data/obj/blogPost";
import {
  getAllBusiness,
  Restaurant,
} from "../Data/obj/restaurant";
import AddBlogPostPhotoDialog from "./addPhotoBlogPostDialog";
import {Category, getAllCategories} from "../Data/obj/category";

function BlogPostEdit({ blogPostId }: { blogPostId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [openPhoto, setOpenPhoto] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [searchRows, setSearchRows] = useState<Restaurant[]>([]);
  const [filterName, setFilterName] = useState<string | null>(null);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleOpenPhotoDialog = () => {
    setOpenPhoto(true);
  };

  const handleClosePhotoDialog = () => {
    setOpenPhoto(false);
  };
  const handleConfirmRestaurantAdd = () => {
    setOpen(false);
    addRestaurant.mutate({ blogPostId: blogPostId as string, restaurantIds:
        [...searchRows.map((r) => r.id), ...newBlogPost.restaurantIds] });
  };
  const { data: restaurants, isLoading: isRestaurantsLoading, isError: isRestaurantError, error: errorRestaurant } = useQuery<Restaurant[], Error>({
    queryFn: getAllBusiness,
    queryKey: ['restaurants'],
    refetchOnWindowFocus: false,
  });

  const { data: allCategories, isLoading: isAllCategoriesLoading, isError: isAllCategoriesError, error: errorCategories } = useQuery<Category[], Error>({
    queryFn: () => getAllCategories(),
    queryKey: ['allCategories'],
    refetchOnWindowFocus: false,
  });



  const searchColumns = [
    { field: 'nombre', headerName: 'Nombre',flex:1 },
    {
          field: 'delete',
          headerName: 'Delete',
          flex: 0.5,
          renderCell: (params:any) => {
            return (
              <Button
                onClick={()=>deleteRows(params)}
              >
                Delete
              </Button>
            );
          }
    }
  ];
  const deleteRows = (params:any) => {
    const filter = searchRows.filter((r) => {

      r.id !== params.row.id
    });

    setSearchRows(
      filter
    );
  }
  const addRestaurant = useMutation(
    {
      mutationFn: (args: AddBlogPostRestaurant) => addResraurantToBlogPost(args),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['blogPostDetails'] });
      },
    },
  );


  const [newBlogPost, setNewBlogPost] = useState<AddBlogPost>({
    title: '',
    subTitle: '',
    photo: '',
    restaurantIds: [],
    size: '',
    category_id: '',
    island_id:''
  });

  const { data: blogPost, isLoading: isBlogPostLoading, isError: isBlogPostError, error: errorBlogPost } = useQuery<BlogPost, Error>({
    queryFn: () => getBlogPostById(blogPostId as string),
    queryKey: ['blogPostDetails', blogPostId],
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (blogPost) {
      setNewBlogPost({
        title: blogPost.title,
        subTitle: blogPost.subTitle,
        photo: blogPost.photo_url,
        restaurantIds: blogPost.restaurants.map(r => r.id),
        size: blogPost.size,
        category_id: blogPost.category_id,
        island_id: blogPost.island_id
      });
      setSelectedRestaurants(blogPost.restaurants);
    }
  }, [blogPost]);

  const handleChange = (field: keyof AddBlogPost) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewBlogPost({ ...newBlogPost, [field]: event.target.value });
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewBlogPost({ ...newBlogPost, size: event.target.value });
  };
  const handleSelectChangeIsland = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewBlogPost({ ...newBlogPost, island_id: event.target.value });
  };
  const handleSelectChangeCategory = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewBlogPost({ ...newBlogPost, category_id: event.target.value });
  };

  const handleRestaurantChange = (event:any, newValue:any) => {
    if (!newValue) return;
    const selectedRestaurant = restaurants!.find((restaurant) => restaurant.nombre === newValue);

    setFilterName(newValue);
    const isAlreadyAdded = searchRows.some(r => r.id === selectedRestaurant!.id) ||
      blogPost!.restaurants.some(r => r.id === selectedRestaurant?.id);
    if (selectedRestaurant && !isAlreadyAdded) {
      const aux:any = [...searchRows];
      aux.push(selectedRestaurant);
      setSearchRows(aux);
    }
  };

  const updateBlogPostMutation:any = useMutation(
    {
      mutationFn: (args: AddBlogPost) => updateBlogPost(args,blogPost!.id),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['blogPostDetails'] });
      },
      });


  const handleSave = () => {
    updateBlogPostMutation.mutate(newBlogPost);
  };

  if (isBlogPostLoading || isAllCategoriesLoading) return <CircularProgress />;
  if (isBlogPostError) return <div>Error: {errorBlogPost?.message}</div>;

  const columns: GridColDef[] = [
    { field: 'photo_url', headerName: 'Foto', width: 64, renderCell: (params: any) => <img src={params.row.photo_url} style={{ width: 50, height: 50 }} /> },
    { field: 'name', headerName: 'Nombre', flex: 0.2 },
    { field: 'municipio', headerName: 'Municipio', flex: 0.2, width: 110 },
    {
      field: 'delete',
      headerName: 'Delete',
      flex: 0.5,
      renderCell: (params: any) => {
        return (
          <Button
            onClick={() => {
              const filter = selectedRestaurants.filter((r: any) => r.id !== params.row.id);
              setSelectedRestaurants(filter);
              addRestaurant.mutate({ blogPostId: blogPostId as string, restaurantIds:filter.map((r: any) => r.id) });
            }}
          >
            Borrar
          </Button>
        );
      }
    }
  ];

  const rows = selectedRestaurants.map((restaurantObj:any, index) => ({
    id: restaurantObj.id,
    photo_url: restaurantObj.fotos[0]?restaurantObj.fotos[0].photoUrl || '' : '', // Reemplaza con la URL real de la foto si tienes esa información
    name: restaurantObj.nombre, // Reemplaza con el nombre real del restaurante si tienes esa información
    municipio: restaurantObj.municipios?.Nombre || '', // Reemplaza con la calificación real del restaurante si tienes esa información
  }));

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h5" component="div">Editar una lista</Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Título"
              fullWidth
              value={newBlogPost.title}
              onChange={handleChange('title')}
            />
            <TextField
              margin="dense"
              label="Subtítulo"
              fullWidth
              multiline={true}
              value={newBlogPost.subTitle}
              onChange={handleChange('subTitle')}
            />
            <TextField
              select
              margin="dense"
              label="Isla"
              fullWidth
              value={newBlogPost.island_id}
              onChange={handleSelectChangeIsland}
            >
              <MenuItem value="76ac0bec-4bc1-41a5-bc60-e528e0c12f4d">Tenerife</MenuItem>
              <MenuItem value="6f91d60f-0996-4dde-9088-167aab83a21a">Gran Canaria</MenuItem>
              <MenuItem value="6877bc07-e011-4c2f-9673-13d8434c1c18">Todos</MenuItem>
            </TextField>
            <TextField
              select
              margin="dense"
              label="Tipo"
              fullWidth
              value={newBlogPost.size}
              onChange={handleSelectChange}
            >
              <MenuItem value="big">Grande</MenuItem>
              <MenuItem value="small">Pequeño</MenuItem>
              <MenuItem value="category">Categoría</MenuItem>
            </TextField>
            {newBlogPost.size === 'category' && <TextField
              select
              margin="dense"
              label="Categoria"
              fullWidth
              value={newBlogPost.category_id}
              onChange={handleSelectChangeCategory}
            >
              {allCategories!.map((category:Category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.nombre}
                </MenuItem>
              ))}
            </TextField>}
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleSave}>
              Guardar
            </Button>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{
          height: '100%',
        }}>
          <CardHeader title={'Foto'} action={<Button variant={'contained'} onClick={handleOpenPhotoDialog}>
            Cambiar foto</Button>} />
          <CardContent sx={{
          }}>
            <img src={newBlogPost.photo} style={{ width: '100%', height: '100%' }} />
          </CardContent>
        </Card>
      </Grid>
      {newBlogPost.size !== 'category' &&
      <Grid item xs={12}>
        <Card>
          <CardHeader title={'Restaurantes'}
                      action={<Button variant={'contained'} onClick={handleClickOpen}>Añadir</Button>}/>
          <CardContent>
            <Typography variant="h5" component="div">Restaurantes</Typography>
            <div style={{height: 400, width: '100%'}}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                checkboxSelection
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
      }
      <Dialog open={open} onClose={handleClose} fullWidth={true} maxWidth={'md'}  >
        <DialogTitle>Añadir Restaurante</DialogTitle>
        <DialogContent>
          <Autocomplete
            sx={{ flexGrow: 1, mr: 2 ,mt:8}}
            options={restaurants?.map((restaurant:any) => restaurant.nombre) || []}
            renderInput={(params) => <TextField {...params} label="Buscar por nombre" />}
            value={filterName}
            onChange={handleRestaurantChange}
            freeSolo={false}
          />
          <div style={{ height: 400, width: '100%', marginTop: '16px' }}>
            <Typography variant="h6">Restaurantes Seleccionados</Typography>
            <DataGrid
              rows={searchRows}
              columns={searchColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmRestaurantAdd} color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      <AddBlogPostPhotoDialog blogPostId={blogPost!.id} open={openPhoto} onClose={handleClosePhotoDialog}/>
    </Grid>
  );
}

export default BlogPostEdit;
