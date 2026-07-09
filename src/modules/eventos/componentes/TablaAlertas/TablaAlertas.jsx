import styles from "./TablaAlertas.module.css";

const NIVEL_EMOJI = { critico: "🔴", alto: "🟠", medio: "🟡", bajo: "🟢" };

export default function TablaAlertas({ data = [] }) {
  if (!data || data.length === 0) return <p className={styles.empty}>No hay alertas activas</p>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Estado</th><th>Usuario</th><th>Oficina</th><th>Score</th><th>Eventos</th><th>Anómalos</th><th>Docs Secreto</th>
          </tr>
        </thead>
        <tbody>
          {data.map((alerta, i) => (
            <tr key={i} className={styles[`row_${alerta.nivel_riesgo}`]}>
              <td>{NIVEL_EMOJI[alerta.nivel_riesgo]} {alerta.nivel_riesgo?.toUpperCase()}</td>
              <td className={styles.nombre}>{alerta.nombre}</td>
              <td>{alerta.oficina}</td>
              <td className={styles.score}>{alerta.score_riesgo?.toFixed(1)}</td>
              <td>{alerta.n_eventos}</td>
              <td>{alerta.n_anomalos}</td>
              <td>{alerta.n_docs_secreto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
