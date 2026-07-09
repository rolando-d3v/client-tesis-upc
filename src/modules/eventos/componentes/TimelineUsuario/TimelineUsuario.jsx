import styles from "./TimelineUsuario.module.css";

const BADGE_EVENTO = {
  VISTA: styles.badgeVista, DESCARGAR: styles.badgeDescargar,
  EDITAR: styles.badgeEditar, ELIMINAR: styles.badgeEliminar,
  GUARDAR_COPIA: styles.badgeCopia,
};

export default function TimelineUsuario({ data = [] }) {
  if (!data || data.length === 0) return <p className={styles.empty}>Sin eventos para este usuario</p>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Fecha</th><th>Hora</th><th>Evento</th><th>Documento</th><th>Clasificación</th>
            <th>Tipo Doc</th><th>Tamaño</th><th>Score</th><th>Fuera Hr</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ev, i) => (
            <tr key={i} className={ev.fuera_horario ? styles.rowFuera : ""}>
              <td>{ev.fecha}</td>
              <td className={styles.hora}>{ev.hora}</td>
              <td><span className={`${styles.badge} ${BADGE_EVENTO[ev.evento] || ""}`}>{ev.evento}</span></td>
              <td>{ev.id_documento}</td>
              <td>{ev.clasificacion}</td>
              <td className={styles.tipoDoc}>{ev.tipo_documento}</td>
              <td>{ev.size_mb} MB</td>
              <td className={styles.score}>{ev.score_riesgo?.toFixed(1)}</td>
              <td>{ev.fuera_horario ? "🌙" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
