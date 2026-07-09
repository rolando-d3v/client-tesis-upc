import { useQuery, useMutation } from "@tanstack/react-query";
import api from "./apiRestMachine";

// ============================================================
// RAW API FUNCTIONS
// ============================================================

export const subirCSVEventos = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/eventos/predecir", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000,
  });
  return response.data;
};

// Dashboard 1
export const getD1Resumen = async () => {
  const response = await api.get("/eventos/dashboard1/resumen");
  return response.data;
};

export const getD1Semaforo = async () => {
  const response = await api.get("/eventos/dashboard1/semaforo");
  return response.data;
};

export const getD1TopRiesgo = async () => {
  const response = await api.get("/eventos/dashboard1/top-riesgo");
  return response.data;
};

export const getD1Alertas = async () => {
  const response = await api.get("/eventos/dashboard1/alertas");
  return response.data;
};

export const getD1Timeline = async () => {
  const response = await api.get("/eventos/dashboard1/timeline");
  return response.data;
};

// Dashboard 2
export const getD2Usuarios = async () => {
  const response = await api.get("/eventos/dashboard2/usuarios");
  return response.data;
};

export const getD2UsuarioDetalle = async (userId) => {
  const response = await api.get(`/eventos/dashboard2/usuario/${userId}`);
  return response.data;
};

// Dashboard 3
export const getD3Heatmap = async () => {
  const response = await api.get("/eventos/dashboard3/heatmap");
  return response.data;
};

export const getD3HistogramaHoras = async () => {
  const response = await api.get("/eventos/dashboard3/histograma-horas");
  return response.data;
};

export const getD3FueraHorario = async () => {
  const response = await api.get("/eventos/dashboard3/fuera-horario");
  return response.data;
};

// Dashboard 4
export const getD4Clasificacion = async () => {
  const response = await api.get("/eventos/dashboard4/clasificacion");
  return response.data;
};

// Dashboard 5
export const getD5Deteccion = async () => {
  const response = await api.get("/eventos/dashboard5/deteccion");
  return response.data;
};

// Módulo 6
export const getM6Perfiles = async () => {
  const response = await api.get("/eventos/modulo6/perfiles");
  return response.data;
};

// ============================================================
// REACT QUERY HOOKS
// ============================================================

export const useSubirCSVEventos = () => {
  return useMutation({ mutationFn: subirCSVEventos });
};

// Dashboard 1
export const useD1Resumen = () => {
  return useQuery({
    queryKey: ["eventos_d1_resumen"],
    queryFn: getD1Resumen,
    staleTime: 1000 * 30,
  });
};

export const useD1Semaforo = () => {
  return useQuery({
    queryKey: ["eventos_d1_semaforo"],
    queryFn: getD1Semaforo,
    staleTime: 1000 * 30,
  });
};

export const useD1TopRiesgo = () => {
  return useQuery({
    queryKey: ["eventos_d1_top_riesgo"],
    queryFn: getD1TopRiesgo,
    staleTime: 1000 * 30,
  });
};

export const useD1Alertas = () => {
  return useQuery({
    queryKey: ["eventos_d1_alertas"],
    queryFn: getD1Alertas,
    staleTime: 1000 * 30,
  });
};

export const useD1Timeline = () => {
  return useQuery({
    queryKey: ["eventos_d1_timeline"],
    queryFn: getD1Timeline,
    staleTime: 1000 * 30,
  });
};

// Dashboard 2
export const useD2Usuarios = () => {
  return useQuery({
    queryKey: ["eventos_d2_usuarios"],
    queryFn: getD2Usuarios,
    staleTime: 1000 * 30,
  });
};

export const useD2UsuarioDetalle = (userId) => {
  return useQuery({
    queryKey: ["eventos_d2_usuario_detalle", userId],
    queryFn: () => getD2UsuarioDetalle(userId),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
};

// Dashboard 3
export const useD3Heatmap = () => {
  return useQuery({
    queryKey: ["eventos_d3_heatmap"],
    queryFn: getD3Heatmap,
    staleTime: 1000 * 30,
  });
};

export const useD3HistogramaHoras = () => {
  return useQuery({
    queryKey: ["eventos_d3_histograma"],
    queryFn: getD3HistogramaHoras,
    staleTime: 1000 * 30,
  });
};

export const useD3FueraHorario = () => {
  return useQuery({
    queryKey: ["eventos_d3_fuera_horario"],
    queryFn: getD3FueraHorario,
    staleTime: 1000 * 30,
  });
};

// Dashboard 4
export const useD4Clasificacion = () => {
  return useQuery({
    queryKey: ["eventos_d4_clasificacion"],
    queryFn: getD4Clasificacion,
    staleTime: 1000 * 30,
  });
};

// Dashboard 5
export const useD5Deteccion = () => {
  return useQuery({
    queryKey: ["eventos_d5_deteccion"],
    queryFn: getD5Deteccion,
    staleTime: 1000 * 30,
  });
};

// Módulo 6
export const useM6Perfiles = () => {
  return useQuery({
    queryKey: ["eventos_m6_perfiles"],
    queryFn: getM6Perfiles,
    staleTime: 1000 * 30,
  });
};
