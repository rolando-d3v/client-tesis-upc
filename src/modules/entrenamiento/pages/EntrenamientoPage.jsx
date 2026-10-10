import { useIsMutating } from "@tanstack/react-query";
import { FaBrain, FaArrowsRotate } from "react-icons/fa6";
import { toast } from "sonner";
import { useEstadoEvaluacion, useReentrenarEventos, useCalibrarEventos } from "../../../api/apiEvaluacion";
import EvaluacionModelo from "../componentes/evaluacion_modelo/EvaluacionModelo";
import styles from "./EntrenamientoPage.module.css";

export default function EntrenamientoPage() {
  const estado = useEstadoEvaluacion();
  const entrenar = useReentrenarEventos();
  const calibrar = useCalibrarEventos();
  const ocupado = useIsMutating({ mutationKey: ["evaluacion_eventos"] }) > 0;
  const modelo = estado.data?.modelos?.find((m) => m.dominio === "eventos");
  const ejecutar = async () => {
    try {
      await entrenar.mutateAsync();
      toast.success("Modelos entrenados. Evalúa el periodo posterior para obtener las métricas actualizadas.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "No se pudo completar el entrenamiento de eventos.");
    }
  };
  const calibrarUmbral = async () => {
    try {
      await calibrar.mutateAsync();
      toast.success("Umbral calibrado con el periodo de validación. Evalúa los eventos restantes.");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "No se pudo calibrar el umbral.");
    }
  };
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}><FaBrain /> Entrenamiento de eventos</h1>
          <p className={styles.subtitle}>Isolation Forest 0.40 + LSTM Autoencoder 0.60 · suma de pesos = 1.00</p>
        </div>
      </div>
      <div className={styles.trainingPanel}>
        <div className={styles.trainingTop}>
          <div className={styles.trainingHeaderLeft}>
            <h3>Dataset de entrenamiento: dt_eventos.csv</h3>
            <p>Ambos modelos aprenden de dt_eventos.csv. El último 15% temporal se reserva para seleccionar la mejor época del LSTM.</p>
            <p>El CSV etiquetado se separa temporalmente: primer 40% para calibrar el umbral y eventos posteriores para evaluar. Las etiquetas no entrenan Isolation Forest ni LSTM.</p>
          </div>
          <button type="button" className={styles.btnTrainExecute} onClick={ejecutar} disabled={ocupado}>
            <FaArrowsRotate /> {entrenar.isPending ? "Entrenando ambos modelos…" : "Entrenar modelos"}
          </button>
          <button type="button" className={styles.btnTrainExecute} onClick={calibrarUmbral} disabled={ocupado || !modelo?.disponible || !modelo?.dataset_prueba_disponible}>
            {calibrar.isPending ? "Calibrando…" : "Calibrar umbral"}
          </button>
          <div className={styles.modelBadgeActive}>
            {modelo?.disponible ? "Ensemble disponible" : "Modelo pendiente de inicialización"}
          </div>
        </div>
      </div>
      {modelo?.calibracion && <div className={styles.trainingPanel}>
        <h3>Umbral activo: {Number(modelo.umbral).toFixed(3)}</h3>
        <p>{modelo.calibracion.eventos_validacion.toLocaleString()} eventos de validación · {modelo.calibracion.eventos_reservados.toLocaleString()} eventos reservados para evaluación.</p>
        <p>Selección por F1, con un máximo de {(modelo.calibracion.fpr_maximo_validacion * 100).toFixed(0)}% de falsos positivos en validación. Este límite no garantiza el resultado futuro.</p>
        {modelo.historial_lstm?.length > 0 && <p>LSTM: {modelo.historial_lstm.length} épocas ejecutadas; se conserva la de menor pérdida de validación.</p>}
      </div>}
      {entrenar.isPending && <p role="status">Entrenando Isolation Forest y las secuencias temporales del LSTM Autoencoder. Esta operación puede tardar varios minutos.</p>}
      <EvaluacionModelo ocupado={ocupado} />
    </div>
  );
}
