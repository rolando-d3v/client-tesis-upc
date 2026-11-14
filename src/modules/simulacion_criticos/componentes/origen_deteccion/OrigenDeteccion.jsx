import { FaBrain, FaScaleBalanced } from "react-icons/fa6";
import { cociente, porcentaje } from "../../simulacionCriticos";
import styles from "./OrigenDeteccion.module.css";

function Fila({ icono, titulo, detalle, grupo }) {
  const recall = cociente(grupo.detectados, grupo.total);
  return (
    <div className={styles.fila}>
      <span className={styles.icono} aria-hidden="true">
        {icono}
      </span>
      <div className={styles.texto}>
        <div className={styles.cabecera}>
          <strong>{titulo}</strong>
          <span>
            <b>{grupo.detectados.toLocaleString("es-PE")}</b> de {grupo.total.toLocaleString("es-PE")} ·{" "}
            {porcentaje(recall)}
          </span>
        </div>
        <div
          className={styles.barra}
          role="meter"
          aria-label={`${titulo}: ${porcentaje(recall)} detectado`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={recall == null ? 0 : Math.round(recall * 100)}
        >
          <span style={{ width: `${(recall ?? 0) * 100}%` }} />
        </div>
        <small>{detalle}</small>
      </div>
    </div>
  );
}

/** Qué parte de los críticos detecta la regla institucional y qué parte solo pueden detectar los modelos. */
export default function OrigenDeteccion({ actual }) {
  return (
    <section className={styles.panel} aria-labelledby="origen-deteccion-titulo">
      <h2 id="origen-deteccion-titulo">Origen de la detección</h2>
      <p>
        La política institucional fija un score mínimo de 0,90 a sus infracciones, por lo que siempre las alerta. El resto
        de los críticos depende solo del ensemble Isolation Forest + LSTM Autoencoder.
      </p>
      <div className={styles.filas}>
        <Fila
          icono={<FaScaleBalanced />}
          titulo="Política institucional"
          detalle="Rol USER / USER 2 + documento SECRETO o RESERVADO + descargar, editar, eliminar o copiar."
          grupo={actual.politica}
        />
        <Fila
          icono={<FaBrain />}
          titulo="Comportamiento (solo modelos)"
          detalle="Críticos sin infracción explícita de la regla: los detecta el ensemble por rareza del evento o de la secuencia."
          grupo={actual.comportamiento}
        />
      </div>
    </section>
  );
}
