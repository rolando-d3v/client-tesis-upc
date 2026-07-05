import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import styles from "./barrasOficinas.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.custom_tooltip}>
        <p className={styles.tooltip_label}>{label}</p>
        <p className={styles.tooltip_value}>{payload[0].value} anomalías</p>
      </div>
    );
  }
  return null;
};

const truncateLabel = (value) => {
  if (typeof value !== "string") return value;
  return value.length > 40 ? `${value.substring(0, 37)}...` : value;
};

export default function BarrasOficinas({ data = [] }) {
  if (!data.length) return null;

  // Cada barra necesita aprox. 35px de espacio vertical para visualizarse correctamente
  const chartHeight = Math.max(360, data.length * 35 + 20);

  return (
    <div className={styles.chart_container}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 45, left: 5, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148,163,184,0.08)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
          />
          <YAxis
            dataKey="oficina"
            type="category"
            width={220}
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickFormatter={truncateLabel}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(192,132,252,0.05)" }} />
          <Bar
            dataKey="cantidad"
            radius={[0, 6, 6, 0]}
            fill="url(#barGradient)"
            barSize={18}
          >
            <LabelList
              dataKey="cantidad"
              position="right"
              style={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
              offset={8}
            />
          </Bar>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
