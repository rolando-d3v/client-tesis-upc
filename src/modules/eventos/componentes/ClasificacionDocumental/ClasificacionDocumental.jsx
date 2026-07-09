import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import styles from "./ClasificacionDocumental.module.css";

const COLORES = { SECRETO: "#ef4444", RESERVADO: "#f97316", CONFIDENCIAL: "#eab308", COMUN: "#22c55e" };

export default function ClasificacionDocumental({ porClasificacion = [], cruce = [], porTipoDocumento = [] }) {
  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.section}>
          <h4 className={styles.subtitle}>📊 Eventos por Clasificación</h4>
          {porClasificacion.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={porClasificacion} dataKey="total_eventos" nameKey="clasificacion" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3} label={({ clasificacion, percent }) => `${clasificacion} ${(percent * 100).toFixed(0)}%`}>
                  {porClasificacion.map((entry, i) => (<Cell key={i} fill={COLORES[entry.clasificacion] || "#818cf8"} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className={styles.empty}>Sin datos</p>}
        </div>
        <div className={styles.section}>
          <h4 className={styles.subtitle}>📋 Detalle por Clasificación</h4>
          <table className={styles.table}>
            <thead><tr><th>Clasificación</th><th>Eventos</th><th>Descargas</th><th>MB</th><th>Fuera Hr</th></tr></thead>
            <tbody>
              {porClasificacion.map((c, i) => (
                <tr key={i}>
                  <td><span className={styles[`badge_${c.clasificacion?.toLowerCase()}`]}>{c.clasificacion}</span></td>
                  <td>{c.total_eventos?.toLocaleString()}</td>
                  <td>{c.n_descargas}</td>
                  <td>{c.total_mb?.toFixed(1)}</td>
                  <td>{c.n_fuera_horario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {cruce.length > 0 && (
        <div className={styles.sectionFull}>
          <h4 className={styles.subtitle}>🔗 Cruce: Clasificación × Horario</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={cruce}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="clasificacion" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar dataKey="mb_fuera_horario" name="MB Fuera Horario" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mb_en_horario" name="MB En Horario" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {porTipoDocumento.length > 0 && (
        <div className={styles.sectionFull}>
          <h4 className={styles.subtitle}>📄 Top Tipos de Documento</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={porTipoDocumento} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis dataKey="NAME_TIPO_DOCUMENTO" type="category" width={180} tick={{ fill: "#e2e8f0", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Bar dataKey="total_eventos" fill="#c084fc" radius={[0, 6, 6, 0]} name="Eventos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
