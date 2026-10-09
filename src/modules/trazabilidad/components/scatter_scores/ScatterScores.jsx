import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceLine,
  ReferenceArea,
  Legend,
} from "recharts";
import styles from "./scatterScores.module.css";

const CustomTooltip = ({ active, payload, umbral = 0.7 }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const isAnomaly = d.anomalia === -1;
    const scoreVal = typeof d.score === "number" ? d.score : Number(d.score || 0);

    return (
      <div className={`${styles.custom_tooltip} ${isAnomaly ? styles.anomaly : ""}`}>
        <p className={styles.tooltip_title}>Registro #{d.id_registro}</p>
        <div className={styles.tooltip_divider}></div>

        <p className={styles.tooltip_score}>
          Score de anomalía (0 a 1):{" "}
          <span className={`${styles.score_value} ${isAnomaly ? styles.anomaly : ""}`}>
            {scoreVal.toFixed(4)}
          </span>
        </p>

        <p className={`${styles.tooltip_status} ${isAnomaly ? styles.anomaly : ""}`}>
          {isAnomaly ? "🚨 Anomalía Detectada" : "✅ Registro Normal"}
        </p>

        <p className={styles.tooltip_hint}>
          {isAnomaly
            ? `Score superior al umbral (${umbral.toFixed(2)}). Comportamiento atípico con alto grado de sospecha en trazabilidad.`
            : `Score inferior al umbral (${umbral.toFixed(2)}). Trámite dentro del rango habitual y esperado.`}
        </p>

        {d.scoreRaw !== undefined && (
          <p className={styles.raw_note}>
            IF raw: {d.scoreRaw.toFixed(5)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ScatterScores({ data = [] }) {
  // Procesamiento y normalización a escala [0, 1] (0 = Normal, 1 = Máx. Anomalía)
  const { normales, anomalias, umbral } = useMemo(() => {
    if (!data?.length) return { normales: [], anomalias: [], umbral: 0.7 };
    const rawScores = data.map((d) => Number(d.score));
    const minRaw = Math.min(...rawScores);
    const maxRaw = Math.max(...rawScores);

    // Detectar si los datos ya vienen normalizados de 0 a 1
    const yaNormalizado = minRaw >= 0 && maxRaw <= 1.05;

    let umbralCalc = 0.7;

    const items = data.map((d) => {
      const raw = Number(d.score);
      let norm;
      if (yaNormalizado) {
        norm = Math.max(0, Math.min(1, raw));
      } else {
        // En Isolation Forest crudo: menor score = mayor anomalía
        // Invertimos y escalamos a [0, 1]: el valor más negativo -> 1.0, el más positivo -> 0.0
        norm = maxRaw !== minRaw ? (maxRaw - raw) / (maxRaw - minRaw) : 0.5;
        norm = Math.max(0, Math.min(1, norm));
      }

      const isAnomaly = d.anomalia === -1;
      return {
        ...d,
        scoreRaw: raw,
        score: Number(norm.toFixed(4)),
        size: isAnomaly ? 50 : 20,
      };
    });

    const anom = items.filter((d) => d.anomalia === -1);
    const norm = items.filter((d) => d.anomalia === 1);

    if (anom.length > 0) {
      // El umbral corresponde al punto de corte donde inician las anomalías
      const minAnomScore = Math.min(...anom.map((d) => d.score));
      umbralCalc = Number(minAnomScore.toFixed(3));
    } else if (!yaNormalizado && maxRaw !== minRaw) {
      // Umbral teórico del modelo cuando raw = 0.0
      umbralCalc = Number(((maxRaw - 0) / (maxRaw - minRaw)).toFixed(3));
    }

    return {
      normales: norm,
      anomalias: anom,
      umbral: Math.max(0.1, Math.min(0.95, umbralCalc)),
    };
  }, [data]);

  if (!data?.length) return null;

  return (
    <div className={styles.container}>
      {/* Indicadores contextuales de la escala */}
      <div className={styles.top_strip}>
        <div className={styles.scale_badge}>
          <span>Escala normalizada:</span>
          <strong>0.0 (Normal) → 1.0 (Anómalo)</strong>
        </div>
        <div className={styles.umbral_badge}>
          <span>Línea de corte:</span>
          <strong>Umbral ≥ {umbral.toFixed(2)}</strong>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 15, right: 30, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />

          <XAxis
            dataKey="id_registro"
            name="ID Registro"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
            tickLine={false}
            tickFormatter={(v) => `#${v}`}
            label={{
              value: "ID de Registro (Orden cronológico / secuencial)",
              position: "insideBottom",
              offset: -12,
              style: { fill: "#64748b", fontSize: 11, fontWeight: 500 },
            }}
          />

          <YAxis
            dataKey="score"
            name="Score"
            domain={[0, 1]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
            tickFormatter={(v) => v.toFixed(1)}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{
              value: "Score de Anomalía (0.0 Normal → 1.0 Máx. Anomalía)",
              angle: -90,
              position: "insideBottomLeft",
              style: { fill: "#64748b", fontSize: 11, fontWeight: 500 },
            }}
          />

          {/* Diámetro dinámico de las burbujas */}
          <ZAxis type="number" dataKey="size" range={[20, 50]} />

          <Tooltip
            content={<CustomTooltip umbral={umbral} />}
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(148,163,184,0.2)" }}
          />

          <Legend
            verticalAlign="top"
            height={40}
            wrapperStyle={{
              fontSize: "0.8rem",
              fontWeight: 600,
              paddingBottom: "10px",
            }}
          />

          {/* Sombrear zona de riesgo superior (score >= umbral) */}
          <ReferenceArea
            y1={umbral}
            y2={1.0}
            fill="rgba(239, 68, 68, 0.05)"
            stroke="rgba(239, 68, 68, 0.12)"
            strokeDasharray="3 3"
          />

          {/* Línea horizontal en Y = umbral */}
          <ReferenceLine
            y={umbral}
            stroke="#f87171"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Umbral de Anomalía (${umbral.toFixed(2)})`,
              fill: "#ef4444",
              fontSize: 10,
              fontWeight: "bold",
              position: "top",
              offset: 6,
            }}
          />

          <Scatter
            name={`Registros Normales (Score < ${umbral.toFixed(2)})`}
            data={normales}
            fill="rgba(148, 163, 184, 0.18)"
            stroke="rgba(148, 163, 184, 0.35)"
            strokeWidth={0.5}
            isAnimationActive={false}
          />

          <Scatter
            name={`Anomalías Detectadas (Score ≥ ${umbral.toFixed(2)})`}
            data={anomalias}
            fill="#ef4444"
            stroke="#b91c1c"
            strokeWidth={0.7}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
