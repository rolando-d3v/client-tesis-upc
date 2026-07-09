import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import styles from "./VolumenMB.module.css";

export default function VolumenMB({ mbPorDia = [], mbPorOficina = [] }) {
  return (
    <div className={styles.container}>
      {mbPorDia.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.subtitle}>📈 MB Transferidos por Día</h4>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mbPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="fecha" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Area type="monotone" dataKey="total_mb" stroke="#c084fc" fill="url(#gradMB)" strokeWidth={2} name="Total MB" />
              <defs>
                <linearGradient id="gradMB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {mbPorOficina.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.subtitle}>🏢 MB por Oficina (Top 15)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mbPorOficina} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis dataKey="oficina" type="category" width={150} tick={{ fill: "#e2e8f0", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="total_mb" fill="#38bdf8" radius={[0, 6, 6, 0]} name="Total MB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
