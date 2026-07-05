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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const isAnomaly = d.anomalia === -1;
    return (
      <div className={`${styles.custom_tooltip} ${isAnomaly ? styles.anomaly : ""}`}>
        <p className={styles.tooltip_title}>
          Registro #{d.id_registro}
        </p>
        <div className={styles.tooltip_divider}></div>
        <p className={styles.tooltip_score}>
          Score de anomalía:{" "}
          <span className={`${styles.score_value} ${isAnomaly ? styles.anomaly : ""}`}>
            {d.score.toFixed(6)}
          </span>
        </p>
        <p className={`${styles.tooltip_status} ${isAnomaly ? styles.anomaly : ""}`}>
          {isAnomaly ? "🚨 Anomalía Detectada" : "✅ Registro Normal"}
        </p>
        <p className={styles.tooltip_hint}>
          {isAnomaly
            ? "El score es negativo (< 0.0). Se aleja significativamente del comportamiento habitual de trazabilidad."
            : "El score es positivo (>= 0.0). Se comporta según los patrones normales registrados."}
        </p>
      </div>
    );
  }
  return null;
};

export default function ScatterScores({ data = [] }) {
  if (!data.length) return null;

  // Añadimos tamaño dinámico (size) para ZAxis para destacar visualmente las anomalías
  const normales = data.filter((d) => d.anomalia === 1).map((d) => ({ ...d, size: 20 }));
  const anomalias = data.filter((d) => d.anomalia === -1).map((d) => ({ ...d, size: 55 }));

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 15, right: 30, bottom: 20, left: 10 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148,163,184,0.06)"
        />
        <XAxis
          dataKey="id_registro"
          name="ID"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
          tickLine={false}
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
          domain={[-1, 1]}
          ticks={[-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1]}
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Score de Anomalía (Isolation Forest)",
            angle: -90,
            position: "insideBottomLeft",
            style: { fill: "#64748b", fontSize: 11, fontWeight: 500 },
          }}
        />
        
        {/* ZAxis mapea el campo 'size' para ajustar dinámicamente el diámetro de las burbujas */}
        <ZAxis type="number" dataKey="size" range={[20, 55]} />
        
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(148,163,184,0.2)" }} />
        
        <Legend 
          verticalAlign="top" 
          height={40} 
          wrapperStyle={{ fontSize: "0.8rem", fontWeight: 600, paddingBottom: "10px" }}
        />

        {/* Sombrear zona de riesgo (anomalías < 0) */}
        <ReferenceArea
          y2={0}
          fill="rgba(239, 68, 68, 0.035)"
          stroke="rgba(239, 68, 68, 0.05)"
          strokeWidth={1}
        />
        
        {/* Línea horizontal en Y = 0 (Umbral del modelo) */}
        <ReferenceLine
          y={0}
          stroke="#f87171"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{
            value: "Umbral de Anomalía (0.0)",
            fill: "#ef4444",
            fontSize: 10,
            fontWeight: "bold",
            position: "top",
            offset: 6,
          }}
        />

        <Scatter
          name="Registros Normales (Score ≥ 0)"
          data={normales}
          fill="rgba(148, 163, 184, 0.12)"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth={0.5}
          isAnimationActive={false}
        />
        <Scatter
          name="Anomalías Detectadas (Score < 0)"
          data={anomalias}
          fill="#ef4444"
          stroke="#b91c1c"
          strokeWidth={0.5}
          isAnimationActive={false}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
