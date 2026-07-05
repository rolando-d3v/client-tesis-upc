import { useState } from "react";
import styles from "./cardCalidadDataset.module.css";

/**
 * Componente premium para mostrar el Índice de Calidad del Dataset (ICD).
 * Muestra una vista dual: Dataset Original (CSV crudo) y Dataset Procesado (post-transformaciones).
 */

const METRIC_CONFIG = {
  completitud: { label: "Completitud", icon: "📊", desc: "Celdas no nulas" },
  validez: { label: "Validez", icon: "✅", desc: "Valores en formato correcto" },
  unicidad: { label: "Unicidad", icon: "🔑", desc: "Registros sin duplicar" },
  consistencia: { label: "Consistencia", icon: "🔗", desc: "Relaciones lógicas coherentes" },
};

function getScoreColor(value) {
  if (value >= 99) return "#34d399";   // green
  if (value >= 95) return "#38bdf8";   // blue
  if (value >= 90) return "#facc15";   // yellow
  if (value >= 80) return "#fb923c";   // orange
  return "#f87171";                     // red
}

function getScoreGradient(value) {
  if (value >= 99) return "linear-gradient(135deg, #34d399, #059669)";
  if (value >= 95) return "linear-gradient(135deg, #38bdf8, #0284c7)";
  if (value >= 90) return "linear-gradient(135deg, #facc15, #eab308)";
  if (value >= 80) return "linear-gradient(135deg, #fb923c, #ea580c)";
  return "linear-gradient(135deg, #f87171, #dc2626)";
}

function CircularProgress({ value, size = 110, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = getScoreColor(value);

  return (
    <svg width={size} height={size} className={styles.icd_circular_progress}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(148, 163, 184, 0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: `drop-shadow(0 0 6px ${color}40)`,
        }}
      />
      {/* Center text */}
      <text
        x="50%"
        y="46%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#000"
        fontSize="1.4rem"
        fontWeight="800"
        fontFamily="Inter, sans-serif"
      >
        {value}%
      </text>
      <text
        x="50%"
        y="66%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#64748b"
        fontSize="0.55rem"
        fontWeight="500"
        fontFamily="Inter, sans-serif"
      >
        ICD
      </text>
    </svg>
  );
}

function MetricBar({ metricKey, value }) {
  const config = METRIC_CONFIG[metricKey];
  const color = getScoreColor(value);

  return (
    <div className={styles.icd_metric_row}>
      <div className={styles.icd_metric_header}>
        <span className={styles.icd_metric_icon}>{config.icon}</span>
        <span className={styles.icd_metric_label}>{config.label}</span>
        <span className={styles.icd_metric_value} style={{ color }}>
          {value}%
        </span>
      </div>
      <div className={styles.icd_metric_bar_track}>
        <div
          className={styles.icd_metric_bar_fill}
          style={{
            width: `${value}%`,
            background: getScoreGradient(value),
          }}
        />
      </div>
      <div className={styles.icd_metric_desc}>{config.desc}</div>
    </div>
  );
}

function DatasetPanel({ data, label, emoji }) {
  if (!data) {
    return (
      <div className={styles.icd_panel}>
        <div className={styles.icd_panel_header}>
          <span>{emoji}</span> {label}
        </div>
        <div className={styles.icd_empty}>Sin datos disponibles</div>
      </div>
    );
  }

  return (
    <div className={styles.icd_panel}>
      <div className={styles.icd_panel_header}>
        <span>{emoji}</span> {label}
      </div>
      <div className={styles.icd_panel_meta}>
        {data.total_registros?.toLocaleString()} registros × {data.total_columnas} columnas
      </div>

      <div className={styles.icd_panel_body}>
        <div className={styles.icd_circle_container}>
          <CircularProgress value={data.icd} />
        </div>
        <div className={styles.icd_metrics_list}>
          {Object.keys(METRIC_CONFIG).map((key) => (
            <MetricBar key={key} metricKey={key} value={data[key] ?? 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CardCalidadDataset({ original, procesado }) {
  const [activeTab, setActiveTab] = useState("ambos");

  const hasOriginal = original != null;
  const hasProcesado = procesado != null;

  if (!hasOriginal && !hasProcesado) return null;

  return (
    <div className={`${styles.icd_card} ${styles.animate_in}`}>
      <div className={styles.icd_title_row}>
        <h3>
          <span>📋</span> Índice de Calidad del Dataset (ICD)
        </h3>
        <div className={styles.icd_tabs}>
          <button
            className={activeTab === "ambos" ? styles.active : ""}
            onClick={() => setActiveTab("ambos")}
          >
            Comparar
          </button>
          <button
            className={activeTab === "original" ? styles.active : ""}
            onClick={() => setActiveTab("original")}
          >
            Original
          </button>
          <button
            className={activeTab === "procesado" ? styles.active : ""}
            onClick={() => setActiveTab("procesado")}
          >
            Procesado
          </button>
        </div>
      </div>

      <div className={`${styles.icd_panels} ${activeTab === "ambos" ? styles.dual : styles.single}`}>
        {(activeTab === "ambos" || activeTab === "original") && (
          <DatasetPanel data={original} label="Dataset Original (CSV)" emoji="📄" />
        )}
        {(activeTab === "ambos" || activeTab === "procesado") && (
          <DatasetPanel data={procesado} label="Dataset Procesado (Features)" emoji="⚙️" />
        )}
      </div>

      {/* ICD comparison summary */}
      {activeTab === "ambos" && hasOriginal && hasProcesado && (
        <div className={styles.icd_comparison_footer}>
          <div className={styles.icd_comparison_item}>
            <span className={styles.icd_comparison_label}>ICD Original</span>
            <span className={styles.icd_comparison_value} style={{ color: getScoreColor(original.icd) }}>
              {original.icd}%
            </span>
          </div>
          <div className={styles.icd_comparison_arrow}>→</div>
          <div className={styles.icd_comparison_item}>
            <span className={styles.icd_comparison_label}>ICD Procesado</span>
            <span className={styles.icd_comparison_value} style={{ color: getScoreColor(procesado.icd) }}>
              {procesado.icd}%
            </span>
          </div>
          <div className={styles.icd_comparison_delta}>
            {procesado.icd >= original.icd ? (
              <span className={styles.delta_positive}>
                ▲ +{(procesado.icd - original.icd).toFixed(2)}%
              </span>
            ) : (
              <span className={styles.delta_negative}>
                ▼ {(procesado.icd - original.icd).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
