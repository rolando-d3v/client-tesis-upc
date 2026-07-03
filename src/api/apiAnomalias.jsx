import { useQuery, useMutation } from "@tanstack/react-query";
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

// ============================================================
// RAW API FUNCTIONS (Para compatibilidad o uso directo)
// ============================================================

export const subirCSVAnomalias = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/anomalias/predecir", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return response.data;
};

export const getResumen = async (filtros = {}) => {
  const response = await api.get(`/anomalias/resumen${buildFechaParams(filtros)}`);
  return response.data;
};

export const getPorClasificacion = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-clasificacion${buildFechaParams(filtros)}`);
  return response.data;
};

export const getPorHora = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-hora${buildFechaParams(filtros)}`);
  return response.data;
};

export const getPorOficina = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-oficina${buildFechaParams(filtros)}`);
  return response.data;
};

export const getPorEstado = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-estado${buildFechaParams(filtros)}`);
  return response.data;
};

export const getScores = async (filtros = {}) => {
  const response = await api.get(`/anomalias/scores${buildFechaParams(filtros)}`);
  return response.data;
};

export const getDetalle = async (page = 1, limit = 20, filtros = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (filtros.fechaInicio) params.append("fecha_inicio", filtros.fechaInicio);
  if (filtros.fechaFin) params.append("fecha_fin", filtros.fechaFin);
  const response = await api.get(`/anomalias/detalle?${params}`);
  return response.data;
};

export const getPorDia = async (filtros = {}) => {
  const response = await api.get(`/anomalias/por-dia${buildFechaParams(filtros)}`);
  return response.data;
};

export const getHeatmap = async (filtros = {}) => {
  const response = await api.get(`/anomalias/heatmap${buildFechaParams(filtros)}`);
  return response.data;
};

// ============================================================
// REACT QUERY CUSTOM HOOKS
// ============================================================

// Hook de Mutación para subir CSV
export const useSubirCSVAnomalias = () => {
  return useMutation({
    mutationFn: subirCSVAnomalias,
  });
};

// Hook de Consulta para resumen ejecutivo
export const useResumenAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_resumen", filtros],
    queryFn: () => getResumen(filtros),
    staleTime: 1000 * 30, // 30 segundos
  });
};

// Hook de Consulta para anomalías por clasificación
export const usePorClasificacionAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_por_clasificacion", filtros],
    queryFn: () => getPorClasificacion(filtros),
    staleTime: 1000 * 30,
  });
};

// Hook de Consulta para anomalías por hora
export const usePorHoraAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_por_hora", filtros],
    queryFn: () => getPorHora(filtros),
    staleTime: 1000 * 30,
  });
};

// Hook de Consulta para anomalías por oficina
export const usePorOficinaAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_por_oficina", filtros],
    queryFn: () => getPorOficina(filtros),
    staleTime: 1000 * 30,
  });
};

// Hook de Consulta para anomalías por estado
export const usePorEstadoAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_por_estado", filtros],
    queryFn: () => getPorEstado(filtros),
    staleTime: 1000 * 30,
  });
};

// Hook de Consulta para scores (Scatter)
export const useScoresAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_scores", filtros],
    queryFn: () => getScores(filtros),
    staleTime: 1000 * 30,
  });
};

// Hook de Consulta para detalle paginado
export const useDetalleAnomalias = (page = 1, limit = 20, filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_detalle", page, limit, filtros],
    queryFn: () => getDetalle(page, limit, filtros),
    staleTime: 1000 * 30,
  });
};

// Hook de Consulta para anomalías por día (Line chart)
export const usePorDiaAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_por_dia", filtros],
    queryFn: () => getPorDia(filtros),
    staleTime: 1000 * 30,
  });
};

// Hook de Consulta para heatmap
export const useHeatmapAnomalias = (filtros = {}) => {
  return useQuery({
    queryKey: ["anomalias_heatmap", filtros],
    queryFn: () => getHeatmap(filtros),
    staleTime: 1000 * 30,
  });
};

// ============================================================
// CALIDAD DEL DATASET (ICD)
// ============================================================

export const getCalidadDataset = async () => {
  const response = await api.get("/anomalias/calidad-dataset");
  return response.data;
};

// Hook de Consulta para calidad del dataset (ICD original + procesado)
export const useCalidadDataset = () => {
  return useQuery({
    queryKey: ["anomalias_calidad_dataset"],
    queryFn: () => getCalidadDataset(),
    staleTime: 1000 * 30,
  });
};

