import axios from "axios";
import {AddCategoryArgs} from "./category";

export interface Photo{
  id: string;
  photoUrl: string;
  type: string;
}
export interface DeletePhotoArgs {
  businessId: string;
  photoId: string;
}
export interface AddPhotoArgs {
  photo: string;
  businessId: string;
}
export const getAllPhotos = async (restaurantId:string):Promise<Photo[]> =>{
  const response = await axios.get(`https://api.guachinchesmodernos.com:480/restaurant/details/${restaurantId}/photos`);
  console.log('photos',response.data.result);

  return response.data.result as Photo[];
}
export const deleteRestaurantPhoto = async ({ businessId, photoId }:DeletePhotoArgs) => {
  const response = await axios.delete(`https://api.guachinchesmodernos.com:480/restaurant/details/${businessId}/photos/${photoId}`);

  return response.data;
};
export const addPhoto = async ({ photo, businessId }: AddPhotoArgs) => {
  const data = { photo,id:businessId };
  const response = await axios.post(`https://api.guachinchesmodernos.com:459/restaurant/${businessId}/addPhoto`, data);
  console.log('addPhoto',response);

  return response.data;
};
