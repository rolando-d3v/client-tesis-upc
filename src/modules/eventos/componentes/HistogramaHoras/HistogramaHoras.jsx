import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import styles from "./HistogramaHoras.module.css";

export default function HistogramaHoras({ data = [] }) {
  if (!data || data.length === 0) return <p className={styles.empty}>Sin datos</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="hora" tick={{ fill: "#475569", fontSize: 10 }} interval={1} />
        <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "rgba(255, 255, 255, 0.95)", border: "1px solid #e2e8f0", borderRadius: 8, color: "#1e293b", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} />
        <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Eventos">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fuera_horario ? "#f97316" : "#818cf8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
