import { FaDiagramProject, FaTree, FaWaveSquare } from "react-icons/fa6";
import LeyendaNiveles from "../../../../components/nivel_riesgo/LeyendaNiveles";
import styles from "./modelosEntrenados.module.css";

const ETIQUETA_FEATURE = {
  riesgo_clasificacion: "Clasificación del documento", log_size: "Tamaño del archivo", log_delta: "Tiempo desde el evento anterior",
  log_eventos_hora: "Eventos en la hora", log_mb_hora: "MB en la hora", es_exterior: "Documento exterior",
  rareza_hora: "Hora inusual para el usuario", rareza_dia: "Día inusual para el usuario", rareza_oficina: "Oficina inusual para el usuario",
  z_size_usuario: "Tamaño frente a su habitual", log_eventos_10min: "Eventos en 10 min", log_docs_10min: "Documentos distintos en 10 min",
  ritmo_relativo: "Ritmo frente a su habitual", dia_relativo: "Volumen del día frente a su habitual",
  proporcion_criticas_10min: "Acumulación de acciones de alto impacto", peso_accion: "Peso de la acción",
  accion_clasificacion: "Acción × clasificación",
};

export default function ModelosEntrenados({ modelo }) {
  const e = modelo?.entrenamiento;
  if (!e) return null;
  const pesos = modelo.pesos_modelos;
  return (
    <section className={styles.panel} aria-labelledby="modelos-titulo">
      <h2 id="modelos-titulo">Modelos entrenados sobre {modelo.dataset_entrenamiento}</h2>
      <p className={styles.sub}>
        {e.registros?.toLocaleString()} eventos hasta el {new Date(e.fecha_max).toLocaleString("es-PE")} · el periodo de
        {" "}{modelo.dataset_prueba} queda fuera del entrenamiento para que la evaluación sea independiente.
      </p>
      <div className={styles.tarjetas}>
        <article className={styles.tarjeta}>
          <h3><FaTree /> Isolation Forest <span>peso {pesos.isolation_forest * 100} %</span></h3>
          <p>Aísla eventos atípicos frente al historial del usuario: hora, oficina, tamaño o ritmo inusuales.</p>
          <dl><div><dt>Árboles</dt><dd>{e.isolation_forest.n_estimators}</dd></div><div><dt>Muestra por árbol</dt><dd>{e.isolation_forest.max_samples}</dd></div></dl>
        </article>
        <article className={styles.tarjeta}>
          <h3><FaWaveSquare /> LSTM Autoencoder <span>peso {pesos.lstm_autoencoder * 100} %</span></h3>
          <p>Reconstruye la secuencia de los últimos eventos de cada usuario; un error alto revela secuencias inusuales (ráfagas, patrones de exfiltración).</p>
          <dl><div><dt>Ventana</dt><dd>{e.lstm_autoencoder.ventana} eventos</dd></div><div><dt>Unidades ocultas</dt><dd>{e.lstm_autoencoder.hidden_size}</dd></div>
            <div><dt>Épocas</dt><dd>{e.lstm_autoencoder.epocas_ejecutadas}</dd></div>
            <div><dt>Mejor pérdida de validación</dt><dd>{e.lstm_autoencoder.mejor_val_loss?.toFixed(5) ?? "—"}</dd></div></dl>
        </article>
        <article className={styles.tarjeta}>
          <h3><FaDiagramProject /> Ensemble</h3>
          <p>Promedia la rareza de ambos modelos frente al entrenamiento. Niveles: medio = top 10 %, alto = top 1 %, crítico = top 0,1 %.</p>
          <dl><div><dt>Umbral de anomalía</dt><dd>{Number(modelo.umbral).toFixed(3)}</dd></div>
            <div><dt>Bloqueo automático de cuenta</dt><dd>≥ {(e.umbral_bloqueo * 100).toFixed(0)} %</dd></div></dl>
        </article>
      </div>
      <h3 className={styles.subtitulo}>Niveles de riesgo del score combinado</h3>
      <LeyendaNiveles />
      <details className={styles.features}>
        <summary>{e.features.length} variables de entrada (compartidas por ambos modelos)</summary>
        <ul>{e.features.map((f) => <li key={f}>{ETIQUETA_FEATURE[f] ?? f}<code>{f}</code></li>)}</ul>
      </details>
    </section>
  );
}
