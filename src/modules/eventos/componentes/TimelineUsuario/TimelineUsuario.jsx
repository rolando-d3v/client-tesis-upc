import styles from "./TimelineUsuario.module.css";

const BADGE_EVENTO = {
  VISTA: styles.badgeVista,
  DESCARGAR: styles.badgeDescargar,
  EDITAR: styles.badgeEditar,
  ELIMINAR: styles.badgeEliminar,
  GUARDAR_COPIA: styles.badgeCopia,
};

export default function TimelineUsuario({ data = [] }) {
  if (!data || data.length === 0) return <p className={styles.empty}>Sin eventos para este usuario</p>;

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.srOnly}>
          Registro cronológico de eventos del usuario
        </caption>
        <thead>
          <tr>
            <th scope="col">N.º</th>
            <th scope="col">Fecha</th>
            <th scope="col">Hora</th>
            <th scope="col">Evento</th>
            <th scope="col">Documento</th>
            <th scope="col">Clasificación</th>
            <th scope="col">Tipo de documento</th>
            <th scope="col">Tamaño</th>
            <th scope="col">Score de riesgo</th>
            <th scope="col">Fuera de horario</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ev, i) => (
            <tr key={i} className={ev.fuera_horario ? styles.rowFuera : ""}>
              <td>{i + 1}</td>
              <td>{ev.fecha}</td>
              <td className={styles.hora}>{ev.hora}</td>
              <td>
                <span className={`${styles.badge} ${BADGE_EVENTO[ev.evento] || ""}`}>{ev.evento}</span>
              </td>
              <td>{ev.id_documento}</td>
              <td>{ev.clasificacion}</td>
              <td className={styles.tipoDoc}>{ev.tipo_documento}</td>
              <td className={styles.numericCell}>
                {ev.size_mb != null ? `${ev.size_mb} MB` : "—"}
              </td>
              <td className={styles.score}>{ev.score_riesgo?.toFixed(1) ?? "—"}</td>
              <td>
                <span className={ev.fuera_horario ? styles.outsideHours : styles.withinHours}>
                  {ev.fuera_horario ? "Sí" : "No"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
