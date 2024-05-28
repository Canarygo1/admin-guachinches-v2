import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import CategoryGrid from "./CategoryGrid";
import RestaurantForm from "./restaurantForm";
import {Area, getAllMunicipalities} from "../Data/obj/municipality";
import {Category, getAllCategories} from "../Data/obj/category";
import {getRestaurantById, Restaurant} from "../Data/obj/restaurant";
import PhotoGallery from "./PhotoGallery";
import VideoGallery from "./VideoGallery";


function RestaurantEdit({restaurantId}: {restaurantId: string}) {

  const [selectedMunicipio, setSelectedMunicipio] = useState<Area | null>(null);
  let municipios: (Area & { zoneName: string })[] = [];

  const { data: restaurant, isLoading: isRestaurantLoading, isError: isRestaurantError, error: errorRestaurant } = useQuery<Restaurant, Error>({
    queryFn: () => getRestaurantById(restaurantId as string),
    queryKey: ['restaurantDetails', restaurantId],
    refetchOnWindowFocus: false,
  });
  const { data: municipalities, isLoading: isMunicipalitiesLoading, isError: isMunicipalitiesError, error: errorMunicipalities } = useQuery<Area[], Error>({
    queryFn: () => getAllMunicipalities(),
    queryKey: ['getAllMunicipalities'],
    refetchOnWindowFocus: false,
  });
  const { data: allCategories, isLoading: isAllCategoriesLoading, isError: isAllCategoriesError, error: errorCategories } = useQuery<Category[], Error>({
    queryFn: () => getAllCategories(),
    queryKey: ['allCategories'],
    refetchOnWindowFocus: false,
  });

  if (municipalities) {
    // @ts-ignore
    municipios = municipalities.flatMap(zone =>
      zone.Municipios.map(municipio => ({ ...municipio, zoneName: zone.Nombre }))
    );
  }

  const [editableFields, setEditableFields] = useState({
    enable: false,
    horarios: '',
    destacado: '',
    nombre: '',
    direccion: '',
    telefono: '',
    ultimoPago: '',
    googleUrl: '',
    municipio: null as Area | null
  });

  useEffect(() => {
    if (restaurant) {
      const assignedMunicipio = municipios.find(m => m.Id === restaurant.municipios.Id);
      setEditableFields({
        enable: restaurant.enable,
        horarios: restaurant.horarios,
        destacado: restaurant.destacado,
        nombre: restaurant.nombre,
        direccion: restaurant.direccion,
        telefono: restaurant.telefono,
        ultimoPago: restaurant.ultimoPago,
        googleUrl: restaurant.googleUrl,
        municipio: assignedMunicipio || null
      });
      setSelectedMunicipio(assignedMunicipio || null);
    }
  }, [restaurant]);

  if (isRestaurantLoading || isMunicipalitiesLoading) return <CircularProgress />;
  if (isRestaurantError) return <Alert severity="error">Error: {errorRestaurant.message}</Alert>;
  if (isMunicipalitiesError) return <Alert severity="error">Error: {errorMunicipalities.message}</Alert>;

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { checked: boolean }>) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;

    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    setEditableFields((prev) => ({ ...prev, [field]: value }));
  };


  const handleMunicipioChange = (event: any, newValue: Area | null) => {
    setEditableFields({ ...editableFields, municipio: newValue });
    setSelectedMunicipio(newValue);
  };

  const categories = restaurant ? restaurant.categoriasRestaurantes!.map((cr:any) => ({
    id: cr.categorias.id,
    nombre: cr.categorias.nombre,
    iconUrl: cr.categorias.iconUrl,
  })) : [];




  return (
    <Grid container spacing={6}>
      <Grid item xs={6} sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        <RestaurantForm
          restaurantId={restaurantId}
          editableFields={editableFields}
          municipios={municipios}
          handleChange={handleChange}
          handleMunicipioChange={handleMunicipioChange}
        />
      </Grid>
      <Grid item xs={6}  sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        <CategoryGrid allCategories={allCategories!}  businessId={restaurant!.id} categoriesSelected={categories} />
        <VideoGallery restaurantId={restaurant!.id}/>

      </Grid>
      <Grid item xs={12}>
        <PhotoGallery restaurantId={restaurant!.id}/>
      </Grid>
      <Grid item xs={12}>
      </Grid>
    </Grid>
  );
}

export default RestaurantEdit;
