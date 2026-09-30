import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import styles from "./TopRiesgo.module.css";
import RoleBadge from "../../../../components/RoleBadge";

const COLORES_NIVEL = {
  critico: "var(--color-critico, #ef4444)",
  alto: "var(--color-alto, #f97316)",
  medio: "var(--color-medio, #eab308)",
  bajo: "var(--color-bajo, #22c55e)",
};

const formatYAxisTick = (tick) => {
  if (!tick) return "";
  const cleanName = tick.includes("@") ? tick.split("@")[0] : tick;
  return cleanName.length > 20 ? `${cleanName.substring(0, 17)}...` : cleanName;
};

const CustomUserTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const user = payload[0].payload;
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.96)",
        border: "1px solid var(--border, #e2e8f0)",
        borderRadius: 8,
        padding: "0.6rem 0.85rem",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        fontSize: "0.78rem",
        color: "#1e293b",
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.35rem" }}>
        {user.nombre}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "0.35rem" }}>
        <span style={{ color: "#64748b" }}>Rol:</span>
        <RoleBadge role={user.rol || user.role} size="small" />
      </div>
      <div style={{ color: "#64748b", marginBottom: "0.25rem" }}>
        <strong>Oficina:</strong> {user.oficina || "N/A"}
      </div>
      <div>
        <strong>Score Riesgo:</strong>{" "}
        <span style={{ fontWeight: 700, color: COLORES_NIVEL[user.nivel_riesgo] || "#ef4444" }}>
          {user.score_riesgo?.toFixed(1)} ({user.nivel_riesgo?.toUpperCase()})
        </span>
      </div>
    </div>
  );
};

export default function TopRiesgo({ topUsuarios = [], topDocumentos = [] }) {
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h4 className={styles.subtitle}>👤 Top 10 Usuarios por Riesgo</h4>
        {topUsuarios.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%" >
            <BarChart data={topUsuarios} layout="vertical" margin={{ left: 5, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis type="number" tick={{ fill: "var(--text)", fontSize: 11 }} />
              <YAxis 
                dataKey="nombre" 
                type="category" 
                width={150} 
                tick={{ fill: "var(--text)", fontSize: 11 }} 
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={<CustomUserTooltip />} />
              <Bar dataKey="score_riesgo" radius={[0, 6, 6, 0]} name="Score Riesgo">
                {topUsuarios.map((entry, i) => (
                  <Cell key={i} fill={COLORES_NIVEL[entry.nivel_riesgo] || "var(--accent)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className={styles.empty}>Sin datos</p>}
      </div>
      <div className={styles.section}>
        <h4 className={styles.subtitle}>📄 Top 10 Documentos por Riesgo</h4>
        {topDocumentos.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID Doc</th><th>Clasificación</th><th>Tipo</th><th>Eventos</th><th>Score</th>
                </tr>
              </thead>
              <tbody>
                {topDocumentos.map((doc, i) => (
                  <tr key={i}>
                    <td>{doc.ID_DOCUMENTO}</td>
                    <td><span className={styles[`badge_${doc.clasificacion?.toLowerCase()}`]}>{doc.clasificacion}</span></td>
                    <td>{doc.tipo_doc}</td>
                    <td>{doc.n_eventos}</td>
                    <td className={styles.scoreCell}>{doc.score_riesgo?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className={styles.empty}>Sin datos</p>}
      </div>
    </div>
  );
}
