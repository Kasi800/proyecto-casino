import axios from "axios";
import { API_BASE_URL } from "../config";

const API_URL = axios.create({
	baseURL: `${API_BASE_URL}/api/games`,
	withCredentials: true,
});

export const startGame = () => {
	return API_URL.post("/blackjack/start");
};
export const hitGame = () => {
	return API_URL.post("/blackjack/hit");
};
export const standGame = () => {
	return API_URL.post("/blackjack/stand");
};
