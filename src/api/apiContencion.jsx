import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./apiRestMachine";

export const CLAVE_BLOQUEOS = "contencion_bloqueos";

export const useBloqueos = (estado = "activos") => useQuery({
  queryKey: [CLAVE_BLOQUEOS, estado],
  queryFn: async () => (await api.get("/contencion/bloqueos", { params: { estado } })).data.bloqueos,
  refetchInterval: 30_000,
});

export const useReporteBloqueo = (idBloqueo) => useQuery({
  queryKey: ["contencion_reporte", idBloqueo],
  queryFn: async () => (await api.get(`/contencion/bloqueos/${idBloqueo}/reporte`)).data,
  enabled: Boolean(idBloqueo),
});

export const useDesbloquearCuenta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idUser, justificacion }) =>
      (await api.post(`/contencion/cuentas/${idUser}/desbloquear`, { justificacion })).data,
    onSuccess: (bloqueo) => {
      queryClient.invalidateQueries({ queryKey: [CLAVE_BLOQUEOS] });
      queryClient.invalidateQueries({ queryKey: ["contencion_reporte", bloqueo.id] });
    },
  });
};
