import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Box,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Grid,
  Card, CardHeader, Alert
} from '@mui/material';
import { Delete, More } from "mdi-material-ui";
import {Category, getAllCategories} from "../../Data/obj/category";
import {deleteBanner, DeleteBanner, getAllBanners, UpdateBannerOrder, updateBannerOrder} from "../../Data/obj/banner";
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import AddBannerPhotoDialog from "../../components/addPhotoBanner";

const ItemType = 'BANNER';

const DraggableBanner = ({ banner, index, moveBanner, deleteBanner }:any) => {
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: ItemType,
    hover(item:any) {
      if (item.index !== index) {
        moveBanner(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <Paper
      ref={ref}
      style={{
        padding: '16px',
        margin: '8px 0',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        position: 'relative',
      }}
    >
      <IconButton
        aria-label="delete"
        size="small"
        color={'error'}
        onClick={() => deleteBanner(index)}
        style={{ position: 'absolute', top: 16, right: 16 }}
      >
        <Delete />
      </IconButton>
      <img src={banner.fotoUrl} height={150} alt={banner.id} style={{ width: '100%' }} />
    </Paper>
  );
};

const BannerGrid = ({ banners }:any) => {

  const queryClient = useQueryClient();
  const updateBannerMutation = useMutation(
    {
      mutationFn: (args: UpdateBannerOrder) => updateBannerOrder(args),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['getAllBanners'] });
      },
    },
  );
  const deleteBannerMutation = useMutation(
    {
      mutationFn: (args: DeleteBanner) => deleteBanner(args),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['getAllBanners'] });
      },
    },
  );
  const moveBanner = (fromIndex:any, toIndex:any) =>{
    updateBannerMutation.mutate({bannerId:banners[fromIndex].id, orden:toIndex});
  };

  const handleDeleteBanner = (index:any) => {
    deleteBannerMutation.mutate({id:banners[index].id});
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Grid container spacing={2}>
        {banners.map((banner:any, index:any) => (
          <Grid item xs={12} sm={6} md={3} key={banner.id}>
            <DraggableBanner
              index={index}
              banner={banner}
              moveBanner={moveBanner}
              deleteBanner={handleDeleteBanner}
            />
          </Grid>
        ))}
      </Grid>
    </DndProvider>
  );
};


function Index() {


  const { data: allBanners, isLoading: isAllBannersLoading, isError: isAllBannersError, error: errorBanners } = useQuery<Category[], Error>({
    queryFn: () => getAllBanners(),
    queryKey: ['getAllBanners'],
    refetchOnWindowFocus: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);



  if (isAllBannersLoading) return <div>Loading...</div>;
  return (
    <Grid p={2}>
      <Card>

        <CardHeader title="Banners"
        action={
          <Button
            aria-label="add"
            color="primary"
            variant={'contained'}
            onClick={() => setDialogOpen(true)}
          >
            Añadir banner
          </Button>
        }
        />
        <Alert severity="info">Arrastra los banners para cambiar su orden</Alert>
      <BannerGrid banners={allBanners} />
      <AddBannerPhotoDialog
        orden={allBanners!.length+1}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      </Card>
    </Grid>
  );
}
export default Index;
