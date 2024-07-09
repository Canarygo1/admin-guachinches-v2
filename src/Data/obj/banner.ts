import axios from "axios";

export interface Banner {
  id: string;
  nombre: string;
  iconUrl: string;
}

export interface AddBanner {

  image: string;
  orden: number;

}
export interface UpdateBannerOrder {
  bannerId:string;
  orden: number;
}
export interface DeleteBanner {
  id:string;
}
export const getAllBanners = async ():Promise<Banner[]> =>{
  const response = await axios.get('https://api.guachinchesmodernos.com:459/banner');

  return response.data as Banner[];
}


export const updateBannerOrder = async ( {bannerId,orden}:UpdateBannerOrder):Promise<void> =>{
  const response = await axios.put(`https://api.guachinchesmodernos.com:480/restaurant/banners/${bannerId}`, {
    orden:orden,
  });

  return response.data ;
}

export const deleteBanner = async ({id}:DeleteBanner):Promise<void> => {
  const response = await axios.delete(`https://api.guachinchesmodernos.com:459/banner/${id}`);

  return response.data ;
}

export const createBanner = async ({image,orden}:AddBanner):Promise<void> => {
  const response = await axios.post('https://api.guachinchesmodernos.com:459/banner', {
    image:image,
    orden:orden,
  });

  return response.data ;
}
