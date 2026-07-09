import styles from "./SemaforoRiesgo.module.css";

const NIVEL_CONFIG = {
  critico: { emoji: "🔴", color: "#ef4444", label: "Crítico" },
  alto: { emoji: "🟠", color: "#f97316", label: "Alto" },
  medio: { emoji: "🟡", color: "#eab308", label: "Medio" },
  bajo: { emoji: "🟢", color: "#22c55e", label: "Bajo" },
};

export default function SemaforoRiesgo({ data = [] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {data.slice(0, 20).map((user) => {
          const nivel = NIVEL_CONFIG[user.nivel_riesgo] || NIVEL_CONFIG.bajo;
          return (
            <div key={user.user_id} className={styles.item} style={{ borderLeftColor: nivel.color }}>
              <div className={styles.header}>
                <span className={styles.emoji}>{nivel.emoji}</span>
                <span className={styles.nombre}>{user.nombre}</span>
              </div>
              <div className={styles.details}>
                <span className={styles.oficina}>{user.oficina}</span>
                <span className={styles.score} style={{ color: nivel.color }}>
                  Score: {user.score_riesgo?.toFixed(1)}
                </span>
              </div>
              <div className={styles.stats}>
                <span>{user.n_eventos} eventos</span>
                <span>{user.n_anomalos} anómalos</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
