import axios from "axios";

export const API_ECO = import.meta.env.VITE_BACKEND_URL_ECOMMERCE || "http://localhost:4000";

// Instancia de axios con withCredentials para enviar cookies automáticamente
const api = axios.create({
  baseURL: API_ECO,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
