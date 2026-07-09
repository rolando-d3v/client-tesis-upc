import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import styles from "./ScatterDeteccion.module.css";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <p><strong>{d.nombre}</strong></p>
      <p>Score IF: {d.score_if?.toFixed(4)}</p>
      <p>Total MB: {d.total_mb?.toFixed(1)}</p>
      <p>Eventos: {d.n_eventos}</p>
      <p>Nivel: {d.nivel_riesgo}</p>
    </div>
  );
};

export default function ScatterDeteccion({ data = [] }) {
  if (!data || data.length === 0) return <p className={styles.empty}>Sin datos</p>;

  const normales = data.filter(d => d.nivel_riesgo === "bajo");
  const medios = data.filter(d => d.nivel_riesgo === "medio");
  const altos = data.filter(d => d.nivel_riesgo === "alto");
  const criticos = data.filter(d => d.nivel_riesgo === "critico");

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis type="number" dataKey="score_if" name="Score IF" tick={{ fill: "#94a3b8", fontSize: 11 }}
          label={{ value: "Score Isolation Forest", position: "bottom", fill: "#64748b", fontSize: 11 }} />
        <YAxis type="number" dataKey="total_mb" name="MB" tick={{ fill: "#94a3b8", fontSize: 11 }}
          label={{ value: "Total MB", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
        <ZAxis type="number" dataKey="n_eventos" range={[40, 300]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter name="Bajo" data={normales} fill="#22c55e" fillOpacity={0.6} />
        <Scatter name="Medio" data={medios} fill="#eab308" fillOpacity={0.7} />
        <Scatter name="Alto" data={altos} fill="#f97316" fillOpacity={0.8} />
        <Scatter name="Crítico" data={criticos} fill="#ef4444" fillOpacity={0.9} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
