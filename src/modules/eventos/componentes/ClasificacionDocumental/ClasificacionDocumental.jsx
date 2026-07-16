import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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
                <Pie
                  data={porClasificacion}
                  dataKey="total_eventos"
                  nameKey="clasificacion"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={3}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, clasificacion }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#475569"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={500}
                      >
                        {`${clasificacion} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {porClasificacion.map((entry, i) => (
                    <Cell key={i} fill={COLORES[entry.clasificacion] || "#818cf8"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    color: "#1e293b",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.empty}>Sin datos</p>
          )}
        </div>
        <div className={styles.section}>
          <h4 className={styles.subtitle}>📋 Detalle por Clasificación</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Clasificación</th>
                <th>Eventos</th>
                <th>Descargas</th>
                <th>MB</th>
                <th>Fuera Hr</th>
              </tr>
            </thead>
            <tbody>
              {porClasificacion.map((c, i) => (
                <tr key={i}>
                  <td>
                    <span className={styles[`badge_${c.clasificacion?.toLowerCase()}`]}>{c.clasificacion}</span>
                  </td>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="clasificacion" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  color: "#1e293b",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#475569" }} />
              <Bar dataKey="mb_fuera_horario" name="MB Fuera Horario" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mb_en_horario" name="MB En Horario" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {porTipoDocumento.length > 0 && (
        <div className={styles.sectionFull}>
          <h4 className={styles.subtitle}>📄 Top Tipos de Documento</h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={porTipoDocumento} layout="vertical" margin={{ left: 250 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis
                dataKey="NAME_TIPO_DOCUMENTO"
                type="category"
                width={180}
                tick={{ fill: "#1e293b", fontSize: 10, fontWeight: 500 }}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  color: "#1e293b",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="total_eventos" fill="#c084fc" radius={[0, 6, 6, 0]} name="Eventos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
