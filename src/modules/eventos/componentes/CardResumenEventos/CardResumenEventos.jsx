import styles from "./CardResumenEventos.module.css";

const ICON_MAP = {
  total: "📊", usuarios: "👥", documentos: "📄", secreto: "🔒",
  fuera_horario: "🌙", anomalos: "⚠️", riesgo: "🎯",
  vista: "👁️", descarga: "⬇️", editar: "✏️", eliminar: "🗑️", copia: "📋",
};

export default function CardResumenEventos({ icon, label, value, sub }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardIcon}>{ICON_MAP[icon] || "📊"}</div>
      <div className={styles.cardInfo}>
        <span className={styles.cardLabel}>{label}</span>
        <span className={styles.cardValue}>{value}</span>
        {sub && <span className={styles.cardSub}>{sub}</span>}
      </div>
    </div>
  );
}
