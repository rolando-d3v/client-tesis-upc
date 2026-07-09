import { Link } from "react-router";
import styles from "../eventosPage.module.css";
import RadarRiesgo from "../../componentes/RadarRiesgo/RadarRiesgo";
import ScatterDeteccion from "../../componentes/ScatterDeteccion/ScatterDeteccion";
import TablaAlertas from "../../componentes/TablaAlertas/TablaAlertas";
import { useD5Deteccion } from "../../../../api/apiEventos";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORES_DIST = { critico: "#ef4444", alto: "#f97316", medio: "#eab308", bajo: "#22c55e" };

export default function Dashboard5Deteccion() {
  const d5Q = useD5Deteccion();
  const loading = d5Q.isLoading;
  const data = d5Q.data;
  const hasData = data && data.scatter_data?.length > 0;

  const distData = data?.distribucion_scores
    ? Object.entries(data.distribucion_scores).map(([key, value]) => ({ name: key, value }))
    : [];

  return (
    <div className={styles.page}>
      <h1>🤖 Dashboard 5 — Motor de Detección de Anomalías</h1>
      <p className={styles.subtitle}>Score Híbrido: Reglas (40%) + Isolation Forest (60%)</p>

      {loading && (<div className={styles.overlay}><div className={styles.spinner} /><p>Cargando...</p></div>)}

      {!hasData && !loading && (
        <div className={styles.emptyState}><div className={styles.emptyIcon}>🤖</div>
          <p>No hay datos. Ve a <Link to="/carga_eventos" style={{ color: "#c084fc", textDecoration: "underline", fontWeight: "bold" }}>Cargar CSV</Link> primero.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3><span>🎯</span> Radar de Riesgo (6 dimensiones)</h3>
              <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                Selecciona hasta 4 usuarios para comparar perfiles
              </p>
              <RadarRiesgo usuarios={data.radar_usuarios} />
            </div>
            <div className={styles.chartCard}>
              <h3><span>📊</span> Distribución de Niveles de Riesgo</h3>
              {distData.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={distData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {distData.map((entry, i) => (<Cell key={i} fill={COLORES_DIST[entry.name] || "#818cf8"} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`${styles.chartsGrid} ${styles.fullWidth}`}>
            <div className={styles.chartCard}>
              <h3><span>🔴</span> Score IF vs Volumen (MB) por Usuario</h3>
              <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                🟢 Bajo | 🟡 Medio | 🟠 Alto | 🔴 Crítico — tamaño = cantidad de eventos
              </p>
              <ScatterDeteccion data={data.scatter_data} />
            </div>
          </div>

          {data.alertas?.length > 0 && (
            <div className={styles.chartCard} style={{ marginTop: "1.5rem" }}>
              <h3><span>⚠️</span> Tabla de Alertas (Score ≥ {10})</h3>
              <TablaAlertas data={data.alertas} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
