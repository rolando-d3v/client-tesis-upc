import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import styles from "./TopRiesgo.module.css";

const COLORES_NIVEL = { critico: "#ef4444", alto: "#f97316", medio: "#eab308", bajo: "#22c55e" };

export default function TopRiesgo({ topUsuarios = [], topDocumentos = [] }) {
  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h4 className={styles.subtitle}>👤 Top 10 Usuarios por Riesgo</h4>
        {topUsuarios.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topUsuarios} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis dataKey="nombre" type="category" width={120} tick={{ fill: "#e2e8f0", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="score_riesgo" radius={[0, 6, 6, 0]} name="Score Riesgo">
                {topUsuarios.map((entry, i) => (
                  <Cell key={i} fill={COLORES_NIVEL[entry.nivel_riesgo] || "#818cf8"} />
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
