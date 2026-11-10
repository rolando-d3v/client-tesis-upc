import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./apiRestMachine";

export const useEstadoRevision = () => useQuery({
  queryKey: ["revision_estado"],
  queryFn: async () => (await api.get("/revision/estado")).data,
});

export const useCasosRevision = () => useQuery({
  queryKey: ["revision_casos"],
  queryFn: async () => (await api.get("/revision/casos")).data,
});

export const useCasoRevision = (id) => useQuery({
  queryKey: ["revision_caso", id],
  queryFn: async () => (await api.get(`/revision/casos/${id}`)).data,
  enabled: !!id,
});

export const useMetricasRevision = () => useQuery({
  queryKey: ["revision_metricas"],
  queryFn: async () => (await api.get("/revision/metricas")).data,
});

export const useRegistrosRevisionGold = () => useQuery({
  queryKey: ["revision_gold_registros"],
  queryFn: async () => (await api.get("/revision/gold/registros")).data,
});

export const useRegistroRevisionGold = (id) => useQuery({
  queryKey: ["revision_gold_registro", id],
  queryFn: async () => (await api.get(`/revision/gold/registros/${id}`)).data,
  enabled: !!id,
});

const refrescar = (cliente) => {
  cliente.invalidateQueries({ queryKey: ["revision_estado"] });
  cliente.invalidateQueries({ queryKey: ["revision_casos"] });
  cliente.invalidateQueries({ queryKey: ["revision_metricas"] });
};

export const useGuardarDecision = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cuerpo }) => (await api.put(`/revision/casos/${id}/decision`, cuerpo)).data,
    onSuccess: (caso) => {
      cliente.setQueryData(["revision_caso", caso.id], caso);
      refrescar(cliente);
    },
  });
};

export const useGuardarDecisionGold = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision }) => (await api.put(`/revision/gold/registros/${id}/decision`, decision)).data,
    onSuccess: (registro) => {
      cliente.setQueryData(["revision_gold_registro", registro.id], registro);
      cliente.invalidateQueries({ queryKey: ["revision_gold_registros"] });
    },
  });
};

export const useGenerarCasos = () => {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: async (porGrupo = 4) => (await api.post("/revision/generar", { por_grupo: porGrupo }, { timeout: 300_000 })).data,
    onSuccess: () => refrescar(cliente),
  });
};

export const descargarDecisiones = async () => {
  const respuesta = await api.get("/revision/exportar", { responseType: "blob" });
  const url = URL.createObjectURL(respuesta.data);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = "decisiones_oficial.csv";
  enlace.click();
  URL.revokeObjectURL(url);
};
