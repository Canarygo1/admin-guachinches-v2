// let userId = GlobalMethods.getUserIdCookies();

import Axios from "../../helpers/api";
import axios from "axios";

const ApiRequest = {

  //GET
  async getBusinessDetails(businessId) {
    return await Axios().get(`restaurant/details/${businessId}`);
  },
  async getCoupunData (couponUserId) {
    return await axios.get(`https://api.guachinchesmodernos.com:459/cupones/${couponUserId}`)
  },
  async setCuponesPassword(password,restaurantId){
    return await axios.put(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}/password`,{
      password
    })
  },
  async getRestaurantById(restaurantId) {
    return await axios.get(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}`)
  },
  async loginRestaurantUser(restaurantId,password){
    return await axios.post(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}/cupones/login`,{
      password:password
    })
  },
  async addCupones(restaurantId,data){
    return await axios.post(`https://api.guachinchesmodernos.com:459/cupones/restaurant/${restaurantId}`,data)
  },
  async googlePlacesIds(){
    return await axios.get(`https://api.guachinchesmodernos.com:459/restaurant/google/place`)
  },
  async googleOpening(){
    return await axios.get(`https://api.guachinchesmodernos.com:459/restaurant/google/opening`)
  },
  async checkAndUseCoupon(couponUserId,restaurantId){
    return await axios.put(`https://api.guachinchesmodernos.com:459/cupones/check/${couponUserId}/restaurant/${restaurantId}`)
  },
  async deleteRestaurant(restaurantId){
    return await axios.delete(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}`)
  },
  async getBusinessType(restaurantId){
    return await axios.get(`https://api.guachinchesmodernos.com:459/restaurant/${restaurantId}/type`)
  },
  async getAllBusinessTypes(){
    return await axios.get(`https://api.guachinchesmodernos.com:459/types`)
  },
  async updateRestaurantType(businessId,typeId){
    return await axios.put(`https://api.guachinchesmodernos.com:459/restaurant/${businessId}/type`,{id:typeId});
  },
  async getAllBusiness() {
    return await axios.get(`https://api.guachinchesmodernos.com:480/restaurant/admin`);
  },
  async getAllMunicipalities() {
    return await Axios().get(`municipality`);
  },
  async getAllCategories() {
    return await Axios().get(`restaurant/category`);
  },
  async getEmployee(employeeId) {
    return await Axios().get(`user/employee/${employeeId}`);
  },
  async getAllPhotos(businessId) {
    return await Axios().get(`restaurant/details/${businessId}/photos`);
  },
  async getAllBanners() {
    return await Axios().get(`restaurant/banners`);
  },
  async login(data) {
    return await Axios().post(`/login`, data);
  },
  async addMenuItem(data, restaurantId) {
    return await Axios().post(`/restaurant/details/${restaurantId}/menu`, data);

  },
  async sendPaymentSMS(data) {
      data.duracion= parseInt(data.duracion);

    return await Axios().post(`/restaurant/details/${data.id}/payment`, data);
  },
  async addRestaurant(data) {
    return await Axios().post(`/restaurant`, data);
  },
  async addCategory(businessId, categoriaId) {
    let data = {categoriaId: categoriaId};

    return await Axios().post(`/restaurant/details/${businessId}/category`,
      data
    )
  },
  async addPhoto(data, businessId){
    return await Axios().post(`/restaurant/details/${businessId}/photos`,data)
  },
  async addMunicipality(data, businessId){
    return await Axios().post(`/restaurant/details/${businessId}/photos`,data)
  },
  async createMunicipality(data, ){
    return await Axios().post(`/municipality`,data)
  },
  async addBanner(data, ){
    return await Axios().post(`/restaurant/banners`,data)
  },

  // async addPhotoBusiness(data, businessId){
  //   return await Axios().post(`/restaurant/details/${businessId}/photos`,data)
  // },
  //PUT
  async updateRestaurant(businessId, data) {
    return await Axios().put(`restaurant/details/${businessId}`, data);
  },

  async updateBannerOrder(bannerId, data) {
    return await Axios().put(`restaurant/banners/${bannerId}`, data);
  },
  async updateMenuItem(data, restaurantId, menuItemId) {
    return await Axios().put(`/restaurant/details/${restaurantId}/menu/${menuItemId}`, data);
  },
  async updatePhoto(data, businessId, photoId){
    return await Axios().put(`/restaurant/details/${businessId}/photos/${photoId}`,data);
  },
  async deleteRestaurantCategory(businessId, categoryId) {
    return await Axios().delete(`restaurant/details/${businessId}/category/${categoryId}`);
  },
  async deleteBanner(bannerId){
    return await Axios().delete(`restaurant/banners/${bannerId}`);
  },
  async deleteRestaurantPhoto(businessId, photoId){
    return await Axios().delete(`restaurant/details/${businessId}/photos/${photoId}`);
  }
}


export default ApiRequest;
