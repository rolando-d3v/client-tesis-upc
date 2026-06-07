import api from "./apiRestMachine";

/**
 * Construye query string con filtros de fecha opcionales.
 */
function buildFechaParams(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.fechaInicio) params.append("fecha_inicio", filtros.fechaInicio);
  if (filtros.fechaFin) params.append("fecha_fin", filtros.fechaFin);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// POST: Subir CSV y ejecutar pipeline
export const subirCSVAnomalias = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/anomalias/predecir", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000, // 2 minutos para archivos grandes
  });
  return response.data;
};

// GET: Resumen (cards)
export const getResumen = async (filtros = {}) => {
  const response = await api.get(`/anomalias/resumen${buildFechaParams(filtros)}`);
  return response.data;
};

// GET: Por clasificación (donut)
export const getPorClasificacion = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-clasificacion${buildFechaParams(filtros)}`);
  return response.data;
};

// GET: Por hora (area chart)
export const getPorHora = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-hora${buildFechaParams(filtros)}`);
  return response.data;
};

// GET: Por oficina (bar chart)
export const getPorOficina = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-oficina${buildFechaParams(filtros)}`);
  return response.data;
};

// GET: Por estado
export const getPorEstado = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-estado${buildFechaParams(filtros)}`);
  return response.data;
};

// GET: Scores (scatter)
export const getScores = async (filtros = {}) => {
  const response = await api.get(`/anomalias/scores${buildFechaParams(filtros)}`);
  return response.data;
};

// GET: Detalle paginado
export const getDetalle = async (page = 1, limit = 20, filtros = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (filtros.fechaInicio) params.append("fecha_inicio", filtros.fechaInicio);
  if (filtros.fechaFin) params.append("fecha_fin", filtros.fechaFin);
  const response = await api.get(`/anomalias/detalle?${params}`);
  return response.data;
};

// GET: Por día (line chart)
export const getPorDia = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-dia${buildFechaParams(filtros)}`);
  return response.data;
};

// GET: Heatmap
export const getHeatmap = async (filtros = {}) => {
  const response = await api.get(`/anomalias/heatmap${buildFechaParams(filtros)}`);
  return response.data;
};
