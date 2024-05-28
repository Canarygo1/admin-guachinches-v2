import axios from "axios";

export interface Category {
  id: string;
  nombre: string;
  iconUrl: string;
}

export interface AddCategoryArgs {
  businessId: string;
  categoriaId: string;
}
export const getAllCategories = async ():Promise<Category[]> =>{
  const response = await axios.get('https://api.guachinchesmodernos.com:480/restaurant/category');

  return response.data.result as Category[];
}


export const addCategory = async ({ businessId, categoriaId }: AddCategoryArgs) => {
  console.log('addCategory',businessId,categoriaId);
  const data = { categoriaId };
  const response = await axios.post(`https://api.guachinchesmodernos.com:480/restaurant/details/${businessId}/category`, data);

  return response.data;
};

export const deleteRestaurantCategory = async ({ businessId, categoriaId }:AddCategoryArgs) => {
  const response = await axios.delete(`https://api.guachinchesmodernos.com:480/restaurant/details/${businessId}/category/${categoriaId}`);

  return response.data;
};
