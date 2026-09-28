import styles from "./KPICardsSOC.module.css";
import {
  FaShieldHalved,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaLock,
} from "react-icons/fa6";

export default function KPICardsSOC({ resumen, onFilterClick }) {
  if (!resumen) return null;

  const {
    total_incidentes = 0,
    por_nivel_riesgo = {},
    por_estado = {},
    tasa_contencion_porcentaje = 0,
  } = resumen;

  const criticos = por_nivel_riesgo.critico || 0;
  const altos = por_nivel_riesgo.alto || 0;
  const abiertos = por_estado.abierto || 0;

  return (
    <div className={styles.grid}>
      <div
        className={styles.card}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("todos")}
      >
        <div className={`${styles.iconWrapper} ${styles.iconTotal}`}>
          <FaShieldHalved />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Total Incidentes</span>
          <span className={styles.value}>{total_incidentes.toLocaleString()}</span>
          <span className={styles.subtext}>{abiertos} abiertos actualmente</span>
        </div>
      </div>

      <div
        className={styles.card}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("critico")}
      >
        <div className={`${styles.iconWrapper} ${styles.iconCritico}`}>
          <FaTriangleExclamation />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Amenazas Críticas</span>
          <span className={styles.value} style={{ color: "#dc2626" }}>
            {criticos.toLocaleString()}
          </span>
          <span className={styles.subtext}>Prioridad máxima de contención</span>
        </div>
      </div>

      <div
        className={styles.card}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("alto")}
      >
        <div className={`${styles.iconWrapper} ${styles.iconAlto}`}>
          <FaCircleExclamation />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Riesgo Alto</span>
          <span className={styles.value} style={{ color: "#ea580c" }}>
            {altos.toLocaleString()}
          </span>
          <span className={styles.subtext}>Requiere investigación activa</span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.iconContencion}`}>
          <FaLock />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Tasa de Contención</span>
          <span className={styles.value} style={{ color: "#16a34a" }}>
            {tasa_contencion_porcentaje}%
          </span>
          <span className={styles.subtext}>Incidentes mitigados o contenidos</span>
        </div>
      </div>
    </div>
  );
}
