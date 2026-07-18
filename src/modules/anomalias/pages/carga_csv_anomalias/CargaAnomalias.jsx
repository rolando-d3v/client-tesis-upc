import { useNavigate } from "react-router";
import { toast } from "sonner";
import UploadCSV from "../../components/upload_csv/UploadCSV";
import { useSubirCSVAnomalias } from "../../../../api/apiAnomalias";
import styles from "./carga.module.css";

export default function CargaAnomalias() {
  const navigate = useNavigate();
  const { mutate: subirCSV, isPending: loading } = useSubirCSVAnomalias();

  const handleUpload = (file) => {
    toast.info("Procesando CSV con Isolation Forest...");
    subirCSV(file, {
      onSuccess: (resultado) => {
        toast.success(
          `✅ Análisis completo: ${resultado.resumen.total_anomalias} anomalías detectadas`
        );
        // Navegar al dashboard de anomalías tras el procesamiento exitoso
        navigate("/anomalias");
      },
      onError: (error) => {
        console.error(error);
        toast.error("Error al procesar el archivo CSV");
      },
    });
  };

  return (
    <div className={styles.content}>
      <h1>Carga de Registros de Trazabilidad</h1>
      <p className={styles.pageSubtitle}>
        Sube un archivo CSV para entrenar el modelo Isolation Forest y analizar anomalías en la base de datos.
      </p>


      {/* Upload CSV Component */}
      <div className={styles.animateIn} style={{ animationDelay: "0.1s" }}>
        <UploadCSV onUpload={handleUpload} loading={loading} />
      </div>

      {/* Processing overlay */}
      {loading && (
        <div className={styles.processingOverlay}>
          <div className={styles.spinner} />
          <p>Ejecutando Pipeline Isolation Forest</p>
          <p className={styles.processingSub}>Limpiando datos, generando features, prediciendo anomalías...</p>
        </div>
      )}
    </div>
  );
}

