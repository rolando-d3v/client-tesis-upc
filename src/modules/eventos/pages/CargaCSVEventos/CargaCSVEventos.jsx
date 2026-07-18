import { useNavigate } from "react-router";
import { toast } from "sonner";
import UploadCSVEventos from "../../componentes/UploadCSVEventos/UploadCSVEventos";
import { useSubirCSVEventos } from "../../../../api/apiEventos";
import styles from "../eventosPage.module.css";

export default function CargaCSVEventos() {
  const navigate = useNavigate();
  const { mutate: subirCSV, isPending: loading } = useSubirCSVEventos();

  const handleUpload = (file) => {
    toast.info("Procesando CSV con Risk Engine (Reglas + Isolation Forest)...");
    subirCSV(file, {
      onSuccess: (resultado) => {
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
