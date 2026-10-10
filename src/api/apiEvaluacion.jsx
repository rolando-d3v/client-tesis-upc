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

export const useEvaluarModelo = () => {
  const cliente = useQueryClient();
  return useMutation({
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
    },
  });
};

export const useBorrarUltimaEvaluacion = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (dominio) => (await api.delete("/evaluacion/ultima", { params: { dominio } })).data,
    onSuccess: (_resultado, dominio) => {
      cliente.setQueryData(["evaluacion", dominio], null);
    },
  });
};

export const useRevisionEventos = () => useQuery({
  queryKey: ["revision_eventos"],
  queryFn: async () => (await api.get("/evaluacion/revision/eventos")).data,
  staleTime: 15_000,
});

export const useFilasRevisionEventos = (id, filtros) => useQuery({
  queryKey: ["revision_filas", id, filtros],
  queryFn: async () => (await api.get(`/evaluacion/revision/eventos/${id}/filas`, { params: filtros })).data,
  enabled: Boolean(id),
  refetchOnWindowFocus: false,
});

export const usePrepararRevisionEventos = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationKey: ["revision_preparar"],
    mutationFn: async () => (await api.post("/evaluacion/revision/eventos/preparar")).data,
    onSuccess: async (resumen) => {
      cliente.setQueryData(["revision_eventos"], (actual) => ({ ...actual, resumen, desactualizada: false }));
      await Promise.all([
        cliente.invalidateQueries({ queryKey: ["revision_eventos"] }),
        cliente.invalidateQueries({ queryKey: ["revision_filas"] }),
      ]);
    },
  });
};

export const useGuardarRevisionEvento = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationKey: ["revision_guardar"],
    mutationFn: async ({ id, eventoId, decision }) =>
      (await api.put(`/evaluacion/revision/eventos/${id}/filas/${eventoId}`, decision)).data,
    onSuccess: async (resultado, { id }) => {
      cliente.setQueryData(["revision_eventos"], (actual) => ({ ...actual, resumen: resultado.resumen }));
      await cliente.invalidateQueries({ queryKey: ["revision_filas", id] });
    },
  });
};

export const useEvaluarDatasetRevisado = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationKey: ["revision_evaluar"],
    mutationFn: async () => (await api.post("/evaluacion/revision/eventos/evaluar")).data,
    onSuccess: (resultado) => {
      cliente.setQueryData(["evaluacion", "eventos"], resultado);
      cliente.invalidateQueries({ queryKey: ["evaluacion_estado"] });
    },
  });
};
