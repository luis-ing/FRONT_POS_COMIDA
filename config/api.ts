import axios from "axios";
import { env } from "./env";

export const api = axios.create({
  baseURL: env.API_URL,
  headers: { "Content-Type": "application/json" },
});

// Adjunta el token JWT en cada petición
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("tienda_comida_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirige al login si el token expiró
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("tienda_comida_token");
      localStorage.removeItem("tienda_comida_user");
      localStorage.removeItem("tienda_comida_negocio");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);