import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./apiRestMachine";

// ============================================================
// RAW API CALLS
// ============================================================

export const getIncidentes = async (params = {}) => {
  const cleanParams = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      cleanParams[key] = params[key];
    }
  });
  const response = await api.get("/correlacion/incidentes", { params: cleanParams });
  return response.data;
};

export const getIncidenteDetalle = async (id) => {
  if (!id) return null;
  const response = await api.get(`/correlacion/incidentes/${id}`);
  return response.data;
};

export const getResumenSOC = async () => {
  const response = await api.get("/correlacion/resumen");
  return response.data;
};

export const patchEstadoIncidente = async ({ id, estado, accion_tomada }) => {
  const response = await api.patch(`/correlacion/incidentes/${id}/estado`, {
    estado,
    accion_tomada,
  });
  return response.data;
};

export const postEjecutarCorrelacion = async (data = {}) => {
  const response = await api.post("/correlacion/ejecutar", data);
  return response.data;
};


// ============================================================
// REACT QUERY HOOKS
// ============================================================

export const useIncidentes = (params = {}) => {
  return useQuery({
    queryKey: ["incidentes", params],
    queryFn: () => getIncidentes(params),
    keepPreviousData: true,
    staleTime: 1000 * 30, // 30s
  });
};

export const useIncidenteDetalle = (id) => {
  return useQuery({
    queryKey: ["incidente", id],
    queryFn: () => getIncidenteDetalle(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 min
  });
};

export const useResumenSOC = () => {
  return useQuery({
    queryKey: ["resumen_soc"],
    queryFn: getResumenSOC,
    staleTime: 1000 * 30,
  });
};

export const useActualizarEstadoIncidente = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchEstadoIncidente,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      queryClient.invalidateQueries({ queryKey: ["incidente", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["resumen_soc"] });
    },
  });
};

export const useEjecutarCorrelacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postEjecutarCorrelacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      queryClient.invalidateQueries({ queryKey: ["resumen_soc"] });
    },
  });
};
