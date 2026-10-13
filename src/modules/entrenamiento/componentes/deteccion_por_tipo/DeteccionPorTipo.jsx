import styles from "./deteccionPorTipo.module.css";

const TIPOS = {
  tamano_extremo: ["Tamaño de archivo extremo", "Puntual"],
  hora_inusual: ["Hora inusual para el usuario", "Puntual"],
  oficina_documento_ajeno: ["Oficina o documento ajeno", "Puntual"],
  fin_de_semana: ["Actividad en fin de semana", "Puntual"],
  rafaga_descargas: ["Ráfaga de descargas", "Secuencial"],
  eliminacion_masiva: ["Eliminación masiva", "Secuencial"],
  recorrido_documentos: ["Recorrido de documentos", "Secuencial"],
  patron_vista_descarga_eliminar: ["Patrón vista → descarga → eliminar", "Secuencial"],
  cambio_ritmo: ["Cambio de ritmo", "Secuencial"],
};
const MODELOS = [["isolation_forest", "Isolation Forest"], ["lstm_autoencoder", "LSTM Autoencoder"], ["ensemble", "Ensemble"]];
const pct = (v) => v == null ? "—" : `${(v * 100).toFixed(0)} %`;

function Celda({ fila }) {
  if (!fila) return <td>—</td>;
  const valor = fila.recall_incidentes_top_k ?? fila.recall_top_k;
  return (
    <td className={valor >= 0.75 ? styles.alto : valor >= 0.4 ? styles.medio : styles.bajo}>
      <strong>{pct(valor)}</strong><small>{pct(fila.recall_top_k)} de eventos</small>
    </td>
  );
}

export default function DeteccionPorTipo({ ranking }) {
  if (!ranking?.modelos?.ensemble?.recall_por_tipo) return null;
  const tipos = Object.keys(ranking.modelos.ensemble.recall_por_tipo);
  const k = ranking.k_anomalias;
  return (
    <section className={styles.panel} aria-labelledby="por-tipo-titulo">
      <h3 id="por-tipo-titulo">Detección por tipo de anomalía</h3>
      <p>
        Porcentaje de incidentes detectados (al menos un evento) entre las {k?.toLocaleString()} alertas de mayor score de cada
        modelo, es decir, con el mismo presupuesto de alertas para los tres. Muestra qué aporta cada modelo: Isolation Forest
        detecta anomalías puntuales y el LSTM, secuencias.
      </p>
      <div className={styles.scroll}>
        <table>
          <thead><tr><th>Tipo de anomalía</th><th>Categoría</th>{MODELOS.map(([id, nombre]) => <th key={id}>{nombre}</th>)}</tr></thead>
          <tbody>
            {tipos.map((tipo) => (
              <tr key={tipo}>
                <th scope="row">{TIPOS[tipo]?.[0] ?? tipo}<small>{ranking.modelos.ensemble.recall_por_tipo[tipo].incidentes} incidentes</small></th>
                <td>{TIPOS[tipo]?.[1] ?? "—"}</td>
                {MODELOS.map(([id]) => <Celda key={id} fila={ranking.modelos[id]?.recall_por_tipo?.[tipo]} />)}
              </tr>
            ))}
            <tr className={styles.resumen}>
              <th scope="row">Precisión en las 100 primeras alertas</th><td />
              {MODELOS.map(([id]) => <td key={id}><strong>{pct(ranking.modelos[id]?.precision_k?.["100"])}</strong></td>)}
            </tr>
            <tr className={styles.resumen}>
              <th scope="row">Recall con {k?.toLocaleString()} alertas</th><td />
              {MODELOS.map(([id]) => <td key={id}><strong>{pct(ranking.modelos[id]?.recall_k?.[String(k)])}</strong></td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
