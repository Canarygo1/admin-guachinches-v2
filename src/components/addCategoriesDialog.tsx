import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemIcon, Checkbox, ListItemText, Button } from '@mui/material';
import {addCategory, AddCategoryArgs, Category} from '../Data/obj/category';

interface AddCategoriesDialogProps {
  open: boolean;
  onClose: () => void;
  allCategories: Category[];
  businessId: string;
}

const AddCategoriesDialog: React.FC<AddCategoriesDialogProps> = ({ open, onClose, allCategories, businessId }) => {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();

  const mutation = useMutation(
    {
      mutationFn: (args: AddCategoryArgs) => addCategory(args),
      onSuccess: () => {
        queryClient.refetchQueries({ queryKey: ['restaurantDetails']})
      },
    },
  );

  const handleToggle = (category: Category) => () => {
    const currentIndex = selectedCategories.indexOf(category);
    const newSelectedCategories = [...selectedCategories];

    if (currentIndex === -1) {
      newSelectedCategories.push(category);
    } else {
      newSelectedCategories.splice(currentIndex, 1);
    }

    setSelectedCategories(newSelectedCategories);
  };

  const handleAdd = () => {
    selectedCategories.forEach(category => {
      mutation.mutate({ businessId, categoriaId: category.id });
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Agregar Categorías</DialogTitle>
      <DialogContent>
        <List>
          {allCategories && allCategories.map((category) => {
            const labelId = `checkbox-list-label-${category.id}`;

            return (
              <ListItem key={category.id} role={undefined} dense button onClick={handleToggle(category)}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedCategories.indexOf(category) !== -1}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': labelId }}
                  />
                </ListItemIcon>
                <ListItemText id={labelId} primary={category.nombre} />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleAdd} color="primary">Agregar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCategoriesDialog;
