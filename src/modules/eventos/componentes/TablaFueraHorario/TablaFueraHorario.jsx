import styles from "./TablaFueraHorario.module.css";

export default function TablaFueraHorario({ data = [], kpi = {} }) {
  return (
    <div className={styles.container}>
      <div className={styles.kpis}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{kpi.total_fuera_horario?.toLocaleString() || 0}</span>
          <span className={styles.kpiLabel}>Fuera de horario</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{kpi.pct_fuera_horario?.toFixed(1) || 0}%</span>
          <span className={styles.kpiLabel}>del total</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiValue}>{kpi.total_en_horario?.toLocaleString() || 0}</span>
          <span className={styles.kpiLabel}>En horario</span>
        </div>
      </div>
      {data.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Usuario</th><th>Fecha</th><th>Hora</th><th>Evento</th><th>Documento</th><th>Clasificación</th><th>MB</th></tr>
            </thead>
            <tbody>
              {data.map((ev, i) => (
                <tr key={i}>
                  <td className={styles.nombre}>{ev.usuario}</td>
                  <td>{ev.fecha}</td>
                  <td className={styles.hora}>{ev.hora}</td>
                  <td>{ev.evento}</td>
                  <td>{ev.documento}</td>
                  <td>{ev.clasificacion}</td>
                  <td>{ev.size_mb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
