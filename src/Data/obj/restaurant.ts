import axios from "axios";
import {Area} from "./municipality";

export interface Restaurant {
  id: string;
  enable: boolean;
  horarios: string;
  destacado: string;
  nombre: string;
  direccion: string;
  telefono: string;
  ultimoPago: string;
  googleUrl: string;
  municipios:Municipio;
  categoriasRestaurantes:categoriaRestaurantes[];
}
export interface categoriaRestaurantes {
  id: string;
  Categorias:{
    id: string;
    nombre: string;
    iconUrl: string;
  }
}
export interface UpdateRestaurantDetailsData {
  enable: boolean;
  horarios: string;
  destacado: string;
  nombre: string;
  direccion: string;
  telefono: string;
  ultimoPago: string;
  googleUrl: string;
  municipio: Area | null;
}
export interface Municipio {
  Id: string;
  nombre: string;
  area_municipiosId:string;
  direccion: string;
}
export interface AddRestaurantArgs {
  nombre: string;
  telefono: string;
  direccion: string;
  municipio: any;
}
export const getAllBusiness = async ():Promise<Restaurant[]> =>{
  const response = await axios.get('https://api.guachinchesmodernos.com:480/restaurant/admin');

  return response.data.result as Restaurant[];
}
export const updateRestaurantDetails = async (restaurantId: string, data: any) => {
  const response = await axios.put(`https://api.guachinchesmodernos.com:480/restaurant/details/${restaurantId}`, data);

  return response.data;
};
export const addRestaurant = async (data: AddRestaurantArgs) => {
const dataParse ={
  nombre: data.nombre,
  telefono: data.telefono,
  direccion: data.direccion,
  NegocioMunicipioId: data.municipio.Id,
  ultimoPago:"2024-05-01"
}
  console.log('addRestaurant',dataParse);
  const response = await axios.post(`https://api.guachinchesmodernos.com:459/restaurant`, dataParse);
 return response.data;
}
export const getRestaurantById = async (restaurantId:string):Promise<Restaurant> =>{
  console.log('restaurantId',restaurantId);
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}`);

  return response.data as Restaurant;
}
