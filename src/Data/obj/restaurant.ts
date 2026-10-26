import axios, { AxiosError } from "axios";
import {Area} from "./municipality";
import { AdminKeyError, clearAdminKey } from "./adminKey";

export interface Restaurant {
  id: string;
  enable: boolean;
  horarios: string;
  destacado: string;
  nombre: string;
  direccion: string;
  telefono: string;

  /** Tras migration-backend/048 ya no llega por las rutas públicas: ver getRestaurantAdminById. */
  ultimoPago?: string | null;
  googleUrl: string;
  link_reserva:string;
  instagram_link:string;
  menu_link:string;
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
  link_reserva:string;
  instagram_link:string;
  menu_link:string;
  direccion: string;
  telefono: string;

  /** Solo se envía si tiene valor (ver updateRestaurantDetails). */
  ultimoPago?: string | null;
  googleUrl: string;
  municipio: Area | null;
}
export interface Municipio {
  Id: string;
  Nombre: string;
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
  const response = await axios.get('https://api.guachinchesmodernos.com:480/restaurant');

  return response.data.result as Restaurant[];
}
export const getAllBusinesByIsland = async (islandId:string):Promise<Restaurant[]> =>{
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/restaurant/by-island/${islandId}`);

  return response.data as Restaurant[];
}
export const updateRestaurantDetails = async (restaurantId: string, data: any) => {
  // migration-dashboard/010: si no tenemos la fecha de último pago (las rutas
  // públicas ya no la devuelven), no se manda, para no pisar la guardada.
  const { ultimoPago, ...rest } = data ?? {};
  const details = typeof ultimoPago === "string" && ultimoPago.trim() !== "" ? { ...rest, ultimoPago } : rest;
  const response = await axios.put(`https://api.guachinchesmodernos.com:480/restaurant/details/${restaurantId}`, details);
  const responseSocial = await axios.put(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}/social`, {
    instagram_link: data.instagram_link,
    link_reserva: data.link_reserva,
    menu_link: data.menu_link,
  });
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
  const response = await axios.post(`https://api.guachinchesmodernos.com:459/restaurant`, dataParse);
return response.data;
}

export const getRestaurantById = async (restaurantId:string):Promise<Restaurant> =>{
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}`);

  return response.data as Restaurant;
}

// ── Datos de cobro (migration-dashboard/010) ─────────────────────────────

/** Fila de `GET :459/restaurant/:id/admin`, filtrada por la ruta del panel. */
export interface RestaurantAdmin {
  id: string;
  ultimoPago: string | null;
  proximoPago: string | null;
  pagoId: string | null;
  movilPago: string | null;
  restaurantTypeId?: string | null;
  restaurantType?: { id: string; name: string } | null;
}

/**
 * Datos de cobro con la clave de administración, a través de la ruta del panel
 * `/api/restaurant/:id/admin/` (que añade `X-Admin-Key` y solo devuelve estos campos).
 *
 * - `null` si el backend aún no tiene la ruta (404): el panel sigue con lo que
 *   trae la ficha pública, como hasta ahora.
 * - 401: borra la clave guardada para que se vuelva a pedir.
 */
export const getRestaurantAdminById = async (restaurantId: string, adminKey: string): Promise<RestaurantAdmin | null> => {
  try {
    const { data } = await axios.get(`/api/restaurant/${encodeURIComponent(restaurantId)}/admin/`, {
      headers: { "X-Admin-Key": adminKey },
    });

    return data as RestaurantAdmin;
  } catch (e) {
    const status = (e as AxiosError)?.response?.status;
    if (status === 404) return null;
    if (status === 401) {
      clearAdminKey();
      throw new AdminKeyError("unauthorized", "Clave de administración incorrecta. Vuelve a introducirla.");
    }
    if (status === 503) {
      throw new AdminKeyError("not_configured", "Administración no configurada en el servidor (ADMIN_API_KEY).");
    }
    throw new AdminKeyError("other", "No se pudieron cargar los datos de cobro. Inténtalo de nuevo.");
  }
};

//delete restaurant
export const deleteRestaurant = async (restaurantId:string) => {
  const response = await axios.delete(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}`);

  return response.data;
}

export const updatePhotoType = async (restaurantId:string, photoId:string) => {
  const response = await axios.put(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}/photo/${photoId}/principal`);

  return response.data;
}

export const getRestaurantsBySurvey = async (surveyId: string, categoryName: string) => {
  const url = `https://api.guachinchesmodernos.com:459/category-restaurants/${surveyId}/${categoryName}`;
  const response = await axios.get(url);
  return response.data; // Devuelve los datos de la API
};
