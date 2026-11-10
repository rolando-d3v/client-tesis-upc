import { useMetricasRevision } from "../../../api/apiRevision";
import styles from "../pages/revisionOficial.module.css";

const NOMBRES = {
  isolation_forest: "Isolation Forest",
  lstm_autoencoder: "LSTM Autoencoder",
  ensemble: "Ensemble",
};
const UNIDADES = { evento: "por evento", caso: "por caso" };
const porcentaje = (v) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);

export default function MetricasRevision() {
  const consulta = useMetricasRevision();
  const m = consulta.data;
  if (consulta.isPending) return <p role="status">Calculando métricas…</p>;
  if (consulta.isError || !m) return <p role="alert" className={styles.error}>No se pudieron calcular las métricas.</p>;
  const c = m.concordancia_dataset;
  return (
    <div className={styles.detalle}>
      <section className={styles.tarjeta}>
        <h2>Métricas con sus decisiones como referencia</h2>
        <p className={styles.meta}>
          {m.casos_decididos} de {m.casos_total} casos decididos. Cada modelo se compara con lo que usted marcó:
          el Isolation Forest evento por evento y el LSTM y el ensemble por caso (¿alertó algún evento del caso?).
        </p>
        {m.alertas?.map((aviso) => (
          <p key={aviso} role="alert" className={styles.error}>{aviso}</p>
        ))}
        {m.casos_decididos === 0 ? (
          <p className={styles.aviso}>Todavía no hay decisiones. Decida algunos casos en la pestaña «Revisar casos».</p>
        ) : (
          <div className={styles.tablaScroll}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th>Modelo</th><th>Unidad</th><th>Evaluados</th><th>TP</th><th>FP</th><th>FN</th><th>TN</th>
                  <th>Precisión</th><th>Recall</th><th>F1</th><th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(m.modelos).map(([id, x]) => (
                  <tr key={id} className={id === "ensemble" ? styles.filaEnsemble : ""}>
                    <th scope="row">{NOMBRES[id]}</th>
                    <td>{UNIDADES[x.unidad]}</td>
                    <td>{x.n}</td>
                    <td>{x.tp}</td><td>{x.fp}</td><td>{x.fn}</td><td>{x.tn}</td>
                    <td>{porcentaje(x.precision)}</td><td>{porcentaje(x.recall)}</td>
                    <td>{porcentaje(x.f1)}</td><td>{porcentaje(x.accuracy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={styles.aviso}>{m.advertencia}</p>
        {(m.sin_respuesta.secuencia > 0 || m.sin_respuesta.incidente > 0) && (
          <p className={styles.meta}>
            Respondidos «no lo sé»: {m.sin_respuesta.secuencia} en el LSTM y {m.sin_respuesta.incidente} en la decisión final (excluidos de las métricas).
          </p>
        )}
      </section>

      {m.casos_decididos > 0 && (
        <section className={styles.tarjeta}>
          <h3>Coincidencia con las etiquetas del dataset</h3>
          <p className={styles.meta}>Decisión final del oficial frente a si el dataset etiquetó algún evento del caso como anomalía.</p>
          <dl className={styles.habito}>
            <div><dt>Oficial: incidente · Dataset: anomalía</dt><dd>{c.oficial_si_dataset_si}</dd></div>
            <div><dt>Oficial: incidente · Dataset: normal</dt><dd>{c.oficial_si_dataset_no}</dd></div>
            <div><dt>Oficial: no incidente · Dataset: anomalía</dt><dd>{c.oficial_no_dataset_si}</dd></div>
            <div><dt>Oficial: no incidente · Dataset: normal</dt><dd>{c.oficial_no_dataset_no}</dd></div>
          </dl>
          <p className={styles.meta}>
            Las filas donde no coinciden son las etiquetas que conviene corregir: al corregirlas, las métricas del
            ensemble reflejan lo que el oficial considera correcto.
          </p>
        </section>
      )}
    </div>
  );
}
