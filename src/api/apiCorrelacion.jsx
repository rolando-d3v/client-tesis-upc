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

export const getReporteIncidente = async (id) => {
  if (!id) return null;
  const response = await api.get(`/correlacion/incidentes/${id}/reporte`);
  return response.data;
};

export const postNeutralizarUsuario = async ({
  incidente_id,
  id_evento,
  evento_registro_id,
  id_user,
  nombre_usuario,
  motivo,
  responsable = "ANALISTA_SOC",
}) => {
  const response = await api.post("/correlacion/neutralizar", {
    incidente_id,
    id_evento,
    evento_registro_id,
    id_user,
    nombre_usuario,
    motivo,
    responsable,
  });
  return response.data;
};

export const postDesbloquearUsuario = async ({
  id_user,
  responsable,
  justificacion,
  incidente_id,
}) => {
  const response = await api.post("/correlacion/desbloquear", {
    id_user,
    responsable,
    justificacion,
    incidente_id,
  });
  return response.data;
};

export const getAlertasBloqueados = async () => {
  const response = await api.get("/correlacion/alertas/bloqueados");
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
      queryClient.invalidateQueries({ queryKey: ["alertas_bloqueados"] });
    },
  });
};

export const useReporteIncidente = (id) => {
  return useQuery({
    queryKey: ["reporte_incidente", id],
    queryFn: () => getReporteIncidente(id),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
};

export const useAlertasBloqueados = () => {
  return useQuery({
    queryKey: ["alertas_bloqueados"],
    queryFn: getAlertasBloqueados,
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 30,
  });
};

export const useNeutralizarUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postNeutralizarUsuario,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      queryClient.invalidateQueries({ queryKey: ["incidente", variables.incidente_id] });
      queryClient.invalidateQueries({ queryKey: ["reporte_incidente", variables.incidente_id] });
      queryClient.invalidateQueries({ queryKey: ["alertas_bloqueados"] });
      queryClient.invalidateQueries({ queryKey: ["resumen_soc"] });
    },
  });
};

export const useDesbloquearUsuario = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postDesbloquearUsuario,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidentes"] });
      if (variables.incidente_id) {
        queryClient.invalidateQueries({ queryKey: ["incidente", variables.incidente_id] });
        queryClient.invalidateQueries({ queryKey: ["reporte_incidente", variables.incidente_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["alertas_bloqueados"] });
      queryClient.invalidateQueries({ queryKey: ["resumen_soc"] });
    },
  });
};

