import styles from "./KPICardsSOC.module.css";
import {
  FaShieldHalved,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaLock,
  FaDatabase,
} from "react-icons/fa6";

export default function KPICardsSOC({ resumen, filtros = {}, onFilterClick }) {
  if (!resumen) return null;

  const {
    total_incidentes = 0,
    total_eventos_analizados = 0,
    total_trazas_analizadas = 0,
    por_nivel_riesgo = {},
    por_estado = {},
    tasa_contencion_porcentaje = 0,
  } = resumen;

  const criticos = por_nivel_riesgo.critico || 0;
  const altos = por_nivel_riesgo.alto || 0;
  const abiertos = por_estado.abierto || 0;

  const activeRisk = (filtros.nivel_riesgo || "").toLowerCase();
  const activeEstado = (filtros.estado || "").toLowerCase();

  return (
    <div className={styles.grid}>
      {/* 1. Total Eventos Analizados (Logs UEBA / Auditoría) */}
      <div
        className={styles.card}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("todos")}
        title="Total de eventos de auditoría y telemetría analizados por el motor"
      >
        <div className={`${styles.iconWrapper} ${styles.iconEventos}`}>
          <FaDatabase />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Eventos Analizados</span>
          <span className={styles.value} style={{ color: "#0284c7" }}>
            {total_eventos_analizados > 0
              ? total_eventos_analizados.toLocaleString()
              : total_incidentes.toLocaleString()}
          </span>
          <span className={styles.subtext}>
            {total_trazas_analizadas > 0
              ? `Logs UEBA (+${total_trazas_analizadas.toLocaleString()} trazas)`
              : "Registros auditados por UEBA"}
          </span>
        </div>
      </div>

      {/* 2. Total Incidentes Correlacionados */}
      <div
        className={`${styles.card} ${!activeRisk && !activeEstado ? styles.cardActive : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("todos")}
        title="Total de amenazas de fuga correlacionadas"
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

      {/* 3. Amenazas Críticas */}
      <div
        className={`${styles.card} ${activeRisk === "critico" ? styles.cardCriticoActive : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("critico")}
        title="Filtrar por amenazas de nivel crítico (clic para alternar)"
      >
        <div className={`${styles.iconWrapper} ${styles.iconCritico}`}>
          <FaTriangleExclamation />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Amenazas Críticas</span>
          <span className={styles.value} style={{ color: "#dc2626" }}>
            {criticos.toLocaleString()}
          </span>
          <span className={styles.subtext}>Máxima de contención</span>
        </div>
      </div>

      {/* 4. Riesgo Alto */}
      <div
        className={`${styles.card} ${activeRisk === "alto" ? styles.cardAltoActive : ""}`}
        style={{ cursor: "pointer" }}
        onClick={() => onFilterClick && onFilterClick("alto")}
        title="Filtrar por amenazas de nivel alto (clic para alternar)"
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

      {/* 5. Tasa de Contención */}
      <div className={styles.card} title="Porcentaje de amenazas neutralizadas o mitigadas">
        <div className={`${styles.iconWrapper} ${styles.iconContencion}`}>
          <FaLock />
        </div>
        <div className={styles.info}>
          <span className={styles.label}>Tasa de Contención</span>
          <span className={styles.value} style={{ color: "#16a34a" }}>
            {tasa_contencion_porcentaje}%
          </span>
          <span className={styles.subtext}>Incidentes contenidos</span>
        </div>
      </div>
    </div>
  );
}
