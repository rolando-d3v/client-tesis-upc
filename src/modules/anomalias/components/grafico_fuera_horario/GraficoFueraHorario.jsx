import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import styles from "./graficoFueraHorario.module.css";

const CLASIF_COLORS = {
  SECRETO: "#ef4444",
  RESERVADO: "#f97316",
  CONFIDENCIAL: "#eab308",
  COMUN: "#3b82f6",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className={styles.custom_tooltip}>
        <p className={styles.tooltip_title}>{item.nombre}</p>
        <p className={styles.tooltip_text}>
          {item.cantidad.toLocaleString()} anomalías ({item.porcentaje || 0}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function GraficoFueraHorario({ data = {} }) {
  const {
    total_anomalias = 0,
    total_fuera_horario = 0,
    total_dentro_horario = 0,
    pct_fuera_horario = 0,
    pct_dentro_horario = 0,
    franjas = [],
    clasificaciones_fuera = [],
  } = data;

  if (!total_anomalias && franjas.length === 0) {
    return null;
  }

  const maxClasifVal = clasificaciones_fuera.length
    ? Math.max(...clasificaciones_fuera.map((c) => c.value))
    : 1;

  return (
    <div className={styles.container}>
      {/* Header con Título y Mini KPI Badges */}
      <div className={styles.header}>
        <div className={styles.title_section}>
          <h3>
            <span>🌙</span> Operaciones Fuera de Horario Laboral (08:00 – 16:00)
          </h3>
          <p className={styles.subtitle}>
            Distribución de anomalías institucionales fuera de la jornada de oficina (madrugadas y noches)
          </p>
        </div>

        <div className={styles.kpi_badges}>
          <div className={`${styles.badge_card} ${styles.badge_fuera}`}>
            <span className={styles.badge_icon}>🌙</span>
            <div className={styles.badge_info}>
              <span className={styles.badge_label}>Fuera de Horario</span>
              <span className={styles.badge_val}>
                {total_fuera_horario.toLocaleString()} ({pct_fuera_horario}%)
              </span>
            </div>
          </div>

          <div className={`${styles.badge_card} ${styles.badge_dentro}`}>
            <span className={styles.badge_icon}>☀️</span>
            <div className={styles.badge_info}>
              <span className={styles.badge_label}>Horario Laboral</span>
              <span className={styles.badge_val}>
                {total_dentro_horario.toLocaleString()} ({pct_dentro_horario}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Gráfico de Franjas + Desglose de Clasificación Fuera de Horario */}
      <div className={styles.content_grid}>
        {/* Columna Izquierda: Gráfico de Barras de Franjas Horarias */}
        <div className={styles.chart_wrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={franjas}
              margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
                vertical={false}
              />
              <XAxis
                dataKey="nombre"
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {franjas.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || (index === 1 ? "#818cf8" : "#f97316")}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Columna Derecha: Clasificaciones de Documentos Afectados Fuera de Horario */}
        <div className={styles.clasif_panel}>
          <div className={styles.clasif_header}>
            <span className={styles.clasif_title}>
              <span>🔒</span> Docs en Horas Inhábiles
            </span>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {total_fuera_horario} regs
            </span>
          </div>

          <div className={styles.clasif_list}>
            {clasificaciones_fuera.length > 0 ? (
              clasificaciones_fuera.map((item, idx) => {
                const color = CLASIF_COLORS[item.name] || "#64748b";
                const pct = ((item.value / maxClasifVal) * 100).toFixed(0);
                return (
                  <div key={idx} className={styles.clasif_item}>
                    <div className={styles.clasif_row}>
                      <span className={styles.clasif_name}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: color,
                            display: "inline-block",
                          }}
                        />
                        {item.name}
                      </span>
                      <span className={styles.clasif_count}>
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.bar_track}>
                      <div
                        className={styles.bar_fill}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "1rem 0" }}>
                Sin registros clasificados fuera de horario
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
