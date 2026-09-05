import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import UploadCSVEventos from "../../componentes/UploadCSVEventos/UploadCSVEventos";
import { useSubirCSVEventos } from "../../../../api/apiEventos";
import styles from "../eventosPage.module.css";

export default function CargaCSVEventos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: subirCSV, isPending: loading } = useSubirCSVEventos();

  const handleUpload = (file) => {
    toast.info("Procesando CSV con Risk Engine (Reglas + Isolation Forest)...");
    subirCSV(file, {
      onSuccess: (resultado) => {
        // Pre-poblar caché de React Query para navegación instantánea sin refetch
        if (resultado?.dashboard1) {
          queryClient.setQueryData(["eventos_d1_resumen"], resultado.dashboard1.resumen);
          queryClient.setQueryData(["eventos_d1_semaforo"], resultado.dashboard1.semaforo);
          queryClient.setQueryData(["eventos_d1_top_riesgo"], {
            top_usuarios: resultado.dashboard1.top_usuarios,
            top_documentos: resultado.dashboard1.top_documentos,
          });
          queryClient.setQueryData(["eventos_d1_alertas"], resultado.dashboard1.alertas);
          queryClient.setQueryData(["eventos_d1_timeline"], resultado.dashboard1.timeline_criticos);
        }
        if (resultado?.dashboard2) {
          queryClient.setQueryData(["eventos_d2_usuarios"], resultado.dashboard2);
        }
        if (resultado?.dashboard3) {
          queryClient.setQueryData(["eventos_d3_heatmap"], resultado.dashboard3.heatmap);
          queryClient.setQueryData(["eventos_d3_histograma"], resultado.dashboard3.histograma_horas);
          queryClient.setQueryData(["eventos_d3_fuera_horario"], {
            kpi: resultado.dashboard3.kpi_fuera_horario,
            tabla: resultado.dashboard3.tabla_fuera_horario,
          });
        }
        if (resultado?.dashboard4) {
          queryClient.setQueryData(["eventos_d4_clasificacion"], resultado.dashboard4);
        }
        if (resultado?.dashboard5) {
          queryClient.setQueryData(["eventos_d5_deteccion"], resultado.dashboard5);
        }
        if (resultado?.modulo6) {
          queryClient.setQueryData(["eventos_m6_perfiles"], resultado.modulo6);
        }

        const resumen = resultado?.dashboard1?.resumen;
        toast.success(
          `✅ Análisis completo: ${resumen?.total_eventos?.toLocaleString() || 0} eventos, ${resumen?.usuarios_anomalos || 0} usuarios de riesgo`
        );
        navigate("/eventos/dashboard-ejecutivo");
      },
      onError: (error) => {
        console.error(error);
        toast.error("Error al procesar el archivo CSV de eventos");
      },
    });
  };

  return (
    <div className={styles.page}>
      <h1>Carga de Dataset de Eventos</h1>
      <p className={styles.subtitle}>
        Sube el archivo CSV de eventos de usuarios para ejecutar el pipeline de detección de riesgo
        (ETL → Score de Reglas → Isolation Forest → Perfiles EWMA)
      </p>
      <div className={styles.animateIn} style={{ animationDelay: "0.1s" }}>
        <UploadCSVEventos onUpload={handleUpload} loading={loading} />
      </div>
      {loading && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p>Ejecutando Risk Engine</p>
          <p className={styles.overlaySub}>ETL, Feature Engineering, Score de Reglas, Isolation Forest, Perfiles EWMA...</p>
        </div>
      )}
    </div>
  );
}
