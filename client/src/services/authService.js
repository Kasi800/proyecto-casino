import axios from "axios";
const API_URL = "http://localhost:3001/api/auth/";

export const register = (userData) => {
  return axios.post(API_URL + "register", userData);
};
export const login = (userData) => {
  return axios.post(API_URL + "login", userData);
};
