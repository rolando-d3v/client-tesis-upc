import api from "./apiRestMachine";

// POST: Subir CSV y ejecutar pipeline
export const subirCSVAnomalias = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/anomalias/predecir", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// GET: Resumen (cards)
export const getResumen = async () => {
  const response = await api.get("/anomalias/resumen");
  return response.data;
};

// GET: Por clasificación (donut)
export const getPorClasificacion = async () => {
  const response = await api.get("/anomalias/por-clasificacion");
  return response.data;
};

// GET: Por hora (area chart)
export const getPorHora = async () => {
  const response = await api.get("/anomalias/por-hora");
  return response.data;
};

// GET: Por oficina (bar chart)
export const getPorOficina = async () => {
  const response = await api.get("/anomalias/por-oficina");
  return response.data;
};

// GET: Por estado
export const getPorEstado = async () => {
  const response = await api.get("/anomalias/por-estado");
  return response.data;
};

// GET: Scores (scatter)
export const getScores = async () => {
  const response = await api.get("/anomalias/scores");
  return response.data;
};

// GET: Detalle paginado
export const getDetalle = async (page = 1, limit = 20) => {
  const response = await api.get(`/anomalias/detalle?page=${page}&limit=${limit}`);
  return response.data;
};

// GET: Por día (line chart)
export const getPorDia = async () => {
  const response = await api.get("/anomalias/por-dia");
  return response.data;
};

// GET: Heatmap
export const getHeatmap = async () => {
  const response = await api.get("/anomalias/heatmap");
  return response.data;
};
