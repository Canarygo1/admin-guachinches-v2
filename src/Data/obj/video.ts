import axios from "axios";

export interface Video{
  id: string;
  url_video: string;
  name: string;
}
export interface DeleteVideoArgs {
  videoId: string;
}
export interface AddVideoArgs {
  restaurantId: string;
  file:any
  title:string
  thumbnail:string
}
export const getAllVideos = async (restaurantId:string):Promise<Video[]> =>{
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/videos/${restaurantId}`);
  console.log('videos',response.data);

  return response.data as Video[];
}
export const deleteRestaurantVideo = async ({ videoId }:DeleteVideoArgs) => {
  console.log('deleteRestaurantVideo',videoId);
  const response = await axios.delete(`https://api.guachinchesmodernos.com:459/videos/${videoId}`);

  return response.data;
};

export const uploadVideo = async ({ restaurantId, file, title,thumbnail }:AddVideoArgs) => {
  const formData = new FormData();
  console.log('file',file);
  formData.append('file', file);
  formData.append('title', title);
  formData.append('restaurant_id', restaurantId);

  const { data } = await axios.post('https://api.guachinchesmodernos.com:459/videos', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  const uploadThumbnail = await axios.put(`https://api.guachinchesmodernos.com:459/videos/${data.id}/thumbnail`, {thumbnail:thumbnail});


  return data;
};
