import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import styles from "./HeatmapEventos.module.css";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p><strong>{d.dia} — {d.hora}</strong></p>
      <p>{d.cantidad} eventos</p>
    </div>
  );
};

export default function HeatmapEventos({ data = [] }) {
  if (!data || data.length === 0) return <p className={styles.empty}>Sin datos</p>;

  const maxCantidad = Math.max(...data.map(d => d.cantidad), 1);

  const chartData = data.map(d => ({
    ...d,
    x: d.hora_num,
    y: d.dia_num,
    z: d.cantidad,
    fillOpacity: d.cantidad / maxCantidad,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis type="number" dataKey="x" domain={[0, 23]} tickCount={24}
          tickFormatter={(v) => `${v}:00`}
          tick={{ fill: "#475569", fontSize: 10 }} label={{ value: "Hora", position: "bottom", fill: "#475569", fontSize: 11 }} />
        <YAxis type="number" dataKey="y" domain={[0, 6]} tickCount={7}
          tickFormatter={(v) => DIAS[v] || ""}
          tick={{ fill: "#475569", fontSize: 11 }} />
        <ZAxis type="number" dataKey="z" range={[20, 400]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={chartData} fill="#c084fc" fillOpacity={0.7}>
          {chartData.map((entry, i) => (
            <circle key={i} fill={entry.cantidad > 0 ? `rgba(192,132,252,${Math.max(0.15, entry.fillOpacity)})` : "transparent"} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
