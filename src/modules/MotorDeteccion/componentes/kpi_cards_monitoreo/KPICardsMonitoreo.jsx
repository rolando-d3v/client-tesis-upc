import React from "react";
import styles from "./KPICardsMonitoreo.module.css";
import {
  FaShieldHalved,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaWaveSquare,
} from "react-icons/fa6";

export default function KPICardsMonitoreo({
  totalEventos = 0,
  totalCriticos = 0,
  totalAnomalias = 0,
  scorePromedio = "0.000",
  onFilterClick,
}) {
  const porcentajeCriticos =
    totalEventos > 0 ? ((totalCriticos / totalEventos) * 100).toFixed(1) : "0.0";
  const porcentajeAnomalias =
    totalEventos > 0 ? ((totalAnomalias / totalEventos) * 100).toFixed(1) : "0.0";

  return (
    <div className={styles.grid}>
      {/* 1. Total Eventos en Sesión */}
      <div
        className={styles.card}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("todos")}
        title="Click para ver todos los eventos recibidos"
      >
        <div className={`${styles.iconWrapper} ${styles.iconTotal}`}>
          <FaShieldHalved />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Eventos en Sesión</span>
          <span className={styles.value}>{totalEventos.toLocaleString()}</span>
          <span className={styles.subtext}>Flujo continuo en tiempo real</span>
        </div>
      </div>

      {/* 2. Amenazas Críticas */}
      <div
        className={styles.card}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("critico")}
        title="Click para filtrar solo eventos críticos"
      >
        <div className={`${styles.iconWrapper} ${styles.iconCritico}`}>
          <FaTriangleExclamation />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Amenazas Críticas</span>
          <span className={styles.value} style={{ color: "#dc2626" }}>
            {totalCriticos.toLocaleString()}
          </span>
          <span className={styles.subtext}>
            {porcentajeCriticos}% del flujo monitoreado
          </span>
        </div>
      </div>

      {/* 3. Anomalías ML Detectadas */}
      <div
        className={styles.card}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("anomalia")}
        title="Click para filtrar solo anomalías ML"
      >
        <div className={`${styles.iconWrapper} ${styles.iconAlto}`}>
          <FaCircleExclamation />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Anomalías Detectadas</span>
          <span className={styles.value} style={{ color: "#ea580c" }}>
            {totalAnomalias.toLocaleString()}
          </span>
          <span className={styles.subtext}>
            {porcentajeAnomalias}% según el ensemble IF + LSTM
          </span>
        </div>
      </div>

      {/* 4. Score Promedio Híbrido */}
      <div className={styles.card}>
        <div className={`${styles.iconWrapper} ${styles.iconStream}`}>
          <FaWaveSquare />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Score Combinado Promedio</span>
          <span className={styles.value} style={{ color: "#16a34a" }}>
            {scorePromedio}
          </span>
          <span className={styles.subtext}>Isolation Forest 40% + LSTM 60%</span>
        </div>
      </div>
    </div>
  );
}
