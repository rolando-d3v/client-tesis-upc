import axios from "axios";

export const API_MACHINE = import.meta.env.VITE_BACKEND_URL_MACHINE || "http://localhost:4000";

// Instancia de axios con withCredentials para enviar cookies automáticamente
const api = axios.create({
  baseURL: API_MACHINE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
