import React, { useState } from 'react';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Avatar, Card, CardHeader, IconButton, Button } from '@mui/material';
import { Delete } from 'mdi-material-ui';
import {AddCategoryArgs, Category, deleteRestaurantCategory} from '../Data/obj/category';
import AddCategoriesDialog from "./addCategoriesDialog";
import { useMutation, useQueryClient} from "@tanstack/react-query";

interface CategoryGridProps {
  categoriesSelected: Category[];
  businessId: string;
  allCategories: Category[];
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ allCategories, categoriesSelected, businessId }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

const queryClient = useQueryClient();

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  const mutation = useMutation(
    {
      mutationFn: (args: AddCategoryArgs) => deleteRestaurantCategory(args),
      onSuccess: () => {
        console.log('Category deleted');
        queryClient.refetchQueries({ queryKey: ['restaurantDetails']})
      },
    },
  );


  const handleDeleteCategory = (categoryId: string) => {
    mutation.mutate({ businessId, categoriaId: categoryId });

  };

  const columns: GridColDef[] = [
    {
      field: 'icon',
      headerName: 'Icono',
      width: 100,
      renderCell: (params: GridRenderCellParams<string>) => <Avatar src={params.value} alt={params.row.nombre} variant={'square'} />,
      sortable: false,
      filterable: false,
    },
    { field: 'nombre', headerName: 'Nombre', width: 200 },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton onClick={() => handleDeleteCategory(params.row.id)} color="secondary">
          <Delete />
        </IconButton>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  const rows = categoriesSelected.map((category: Category) => ({
    id: category.id,
    icon: category.iconUrl,
    nombre: category.nombre,
  }));

  const availableCategories = allCategories?.filter(category => !categoriesSelected.some(selected => selected.id === category.id)) || [];

  return (
    <Card>
      <CardHeader
        title="Categorias"
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
          >
            Agregar Categoría
          </Button>
        }
      />
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
      </div>
      {allCategories && (
        <AddCategoriesDialog
          businessId={businessId}
          open={isDialogOpen}
          onClose={handleCloseDialog}
          allCategories={availableCategories}
        />
      )}
    </Card>
  );
};

export default CategoryGrid;
