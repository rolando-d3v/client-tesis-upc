import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./apiRestMachine";

export const useEstadoEvaluacion = () => useQuery({
  queryKey: ["evaluacion_estado"],
  queryFn: async () => (await api.get("/evaluacion/estado")).data,
  staleTime: 30_000,
});

export const useUltimaEvaluacion = (dominio) => useQuery({
  queryKey: ["evaluacion", dominio],
  queryFn: async () => (await api.get("/evaluacion/ultima", { params: { dominio } })).data,
  staleTime: 30_000,
});

// Eventos críticos de la última evaluación (orden cronológico), para /simulacion-eventos-criticos.
// Se regeneran en cada evaluación, así que toda mutación que evalúa o cambia el modelo invalida esta clave.
export const CLAVE_CRITICOS = "evaluacion_criticos";

export const useEventosCriticos = (dominio = "eventos") => useQuery({
  queryKey: [CLAVE_CRITICOS, dominio],
  queryFn: async () => (await api.get("/evaluacion/criticos", { params: { dominio } })).data,
  staleTime: 60_000,
});

export const useEvaluarModelo = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationKey: ["evaluacion_eventos"],
    mutationFn: async ({ archivo, dominio, etiquetasVerificadas }) => {
      const datos = new FormData();
      datos.append("archivo", archivo);
      datos.append("dominio", dominio);
      datos.append("etiquetas_verificadas", String(etiquetasVerificadas));
      return (await api.post("/evaluacion/csv", datos, {
        headers: { "Content-Type": "multipart/form-data" },
      })).data;
    },
    onSuccess: (resultado) => {
      cliente.setQueryData(["evaluacion", resultado.dominio], resultado);
      cliente.invalidateQueries({ queryKey: ["evaluacion_estado"] });
      cliente.invalidateQueries({ queryKey: [CLAVE_CRITICOS] });
    },
  });
};

export const useReentrenarEventos = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationKey: ["evaluacion_eventos"],
    mutationFn: async () => (await api.post("/evaluacion/eventos/reentrenar", {}, { timeout: 1_800_000 })).data,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ["evaluacion_estado"] });
      cliente.invalidateQueries({ queryKey: [CLAVE_CRITICOS] });
      cliente.invalidateQueries({ queryKey: ["evaluacion", "eventos"] });
    },
  });
};

export const useCalibrarEventos = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationKey: ["evaluacion_eventos"],
    mutationFn: async () => (await api.post("/evaluacion/eventos/calibrar", {}, { timeout: 600_000 })).data,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: ["evaluacion_estado"] });
      cliente.invalidateQueries({ queryKey: [CLAVE_CRITICOS] });
      cliente.invalidateQueries({ queryKey: ["evaluacion", "eventos"] });
    },
  });
};

export const useEvaluarDatasetEventos = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationKey: ["evaluacion_eventos"],
    mutationFn: async () => (await api.post("/evaluacion/eventos/evaluar-dataset", {}, { timeout: 600_000 })).data,
    onSuccess: (resultado) => {
      cliente.setQueryData(["evaluacion", "eventos"], resultado);
      cliente.invalidateQueries({ queryKey: ["evaluacion_estado"] });
      cliente.invalidateQueries({ queryKey: [CLAVE_CRITICOS] });
    },
  });
};

export const useBorrarUltimaEvaluacion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (dominio) => (await api.delete("/evaluacion/ultima", { params: { dominio } })).data,
    onSuccess: (_resultado, dominio) => {
      cliente.setQueryData(["evaluacion", dominio], null);
      cliente.invalidateQueries({ queryKey: [CLAVE_CRITICOS, dominio] });
    },
  });
};
