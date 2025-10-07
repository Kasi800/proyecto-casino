import axios from "axios";
import { API_BASE_URL } from "../config";

const API_URL = axios.create({
	baseURL: `${API_BASE_URL}/api/auth`,
	withCredentials: true,
});

export const register = (userData) => {
	return API_URL.post("/register", userData);
};
export const login = (userData) => {
	return API_URL.post("/login", userData);
};
export const logout = () => {
	return API_URL.post("/logout");
};
export const getProtected = () => {
	return API_URL.get("/protected");
};
