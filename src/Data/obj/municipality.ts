import axios from "axios";

export interface Municipality{
  id: string;
  name: string;
  area_municipiosId:string;

}
export interface Area{
  Id: string;
  Municipios?: Municipality[];
  Nombre: string;
  zoneName:string;
}
export const getAllMunicipalities = async ():Promise<Area[]> =>{
  const response = await axios.get('https://api.guachinchesmodernos.com:480/municipality');

  return response.data.result as Area[];
}

export const getAllMunicipalitiesByIsland = async (islandId:string):Promise<Area[]> =>{
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/municipios/islands/${islandId}`);
  return response.data as Area[];
}
export const getAllMunicipalitiesArea = async (areaId:string):Promise<Area[]> =>{
  console.log('response')
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/municipios/areas/${areaId}`);
  console.log('response',response)
  return response.data as Area[];
}
export const getAllAreas = async ():Promise<Area[]> =>{
  const response = await axios.get('https://api.guachinchesmodernos.com:480/areas');

  return response.data.result as Area[];
}
export const getAreasByIsland = async (islandId:string) => {
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/areas/islands/${islandId}`);
  return response.data;
};
