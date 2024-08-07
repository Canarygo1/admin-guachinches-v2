import axios from "axios";

export interface BlogPost {
  id: string;
  title: string;
  subTitle: string;
  size: string;
  photo_url: string;
  restaurants: any[];
  category_id: string;
  island_id: string;
}

export interface AddBlogPost {
  title: string;
  subTitle: string;
  size: string;
  photo: any;
  restaurantIds: string[];
  category_id: string;
  island_id: string;
}
export interface AddPhotoBlogPostArgs {
  photo: string;
  blogPostId: string;
}
export interface AddBlogPostRestaurant {
  blogPostId: string;
  restaurantIds: string[];
}
export const getAllBlogPosts = async ():Promise<BlogPost[]> =>{
  const response = await axios.get('https://api.guachinchesmodernos.com:459/blogPost');
  console.log('response',response);
  response.data.forEach((element: any) => {
    element.id = element.Id;
    delete element.Id;
  } );

  return response.data as BlogPost[];
}
export const getBlogPostById = async (id: string):Promise<BlogPost> =>{
  const response = await axios.get(`https://api.guachinchesmodernos.com:459/blogPost/${id}`);
  console.log('response',response);
  response.data.forEach((element: any) => {
    element.id = element.Id;
    delete element.Id;
  } );

  return response.data[0] ;
}

export const addBlogPost = async (blogPost: AddBlogPost) => {
  const response = await axios.post(`https://api.guachinchesmodernos.com:459/blogPost`, blogPost);

  return response.data;
};

export const updateBlogPost = async (blogPost: AddBlogPost,id:string) => {
  blogPost.photo = ''
  blogPost.restaurantIds = [];
  console.log('updateBlogPost',blogPost)
  const response = await axios.put(`https://api.guachinchesmodernos.com:459/blogPost/`+id, {
    "title":blogPost.title,
    "subTitle":blogPost.subTitle,
    "size":blogPost.size,
    "photo":'',
    "category_id":blogPost.category_id,
    "island_id":blogPost.island_id
  });

  console.log('updateBlogPost',response.data);

  return response.data;
}
export const updateBlogPostPhoto = async ({blogPostId,photo}:AddPhotoBlogPostArgs) => {

  const response = await axios.put(`https://api.guachinchesmodernos.com:459/blogPost/`+blogPostId, {
    "photo":photo,
  });
  console.log('updateBlogPost',response.data);

  return response.data;
}
export const addResraurantToBlogPost = async ({ blogPostId, restaurantIds }: AddBlogPostRestaurant) => {
  console.log('restaurantIds',restaurantIds);
  const response = await axios.put(`https://api.guachinchesmodernos.com:459/blogPost/${blogPostId}/restaurants`, {
    "restaurantsIds":restaurantIds
  });
  console.log('addRestaurants',response.data);
  return response.data;
}
export const deleteBlogPost = async (id: string) => {
  console.log('delte')
  const response = await axios.delete(`https://api.guachinchesmodernos.com:459/blogPost/${id}`);

  return response.data;
}
