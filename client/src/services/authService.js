import axios from "axios";
const API_URL = axios.create({
	baseURL: "http://localhost:3001/api/auth",
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
