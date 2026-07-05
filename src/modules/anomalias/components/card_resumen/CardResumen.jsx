import styles from "./cardResumen.module.css";

const ICONS = {
  total: "📊",
  anomalias: "🚨",
  porcentaje: "⚠️",
  secreto: "🔒",
};

export default function CardResumen({ icon = "total", label, value, sub }) {
  return (
    <div className={`${styles.stat_card} ${styles[`stat_card_${icon}`]} ${styles.animate_in}`}>
      <div className={styles.card_icon}>{ICONS[icon] || "📊"}</div>
      <div className={styles.card_label}>{label}</div>
      <div className={styles.card_value}>{value}</div>
      {sub && <div className={styles.card_sub}>{sub}</div>}
    </div>
  );
}
