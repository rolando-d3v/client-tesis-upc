import { Link } from "react-router";
import styles from "../eventosPage.module.css";
import HeatmapEventos from "../../componentes/HeatmapEventos/HeatmapEventos";
import HistogramaHoras from "../../componentes/HistogramaHoras/HistogramaHoras";
import TablaFueraHorario from "../../componentes/TablaFueraHorario/TablaFueraHorario";
import { useD3Heatmap, useD3HistogramaHoras, useD3FueraHorario } from "../../../../api/apiEventos";

export default function Dashboard3Temporal() {
  const heatmapQ = useD3Heatmap();
  const histQ = useD3HistogramaHoras();
  const fueraQ = useD3FueraHorario();
  const loading = heatmapQ.isLoading;
  const hasData = heatmapQ.data?.length > 0;

  return (
    <div className={styles.page}>
      <h1>⏰ Dashboard 3 — Actividad Temporal</h1>
      <p className={styles.subtitle}>Análisis de acceso fuera de horario (08:00-16:00) — variable más sensible</p>

      {loading && (<div className={styles.overlay}><div className={styles.spinner} /><p>Cargando...</p></div>)}

      {!hasData && !loading && (
        <div className={styles.emptyState}><div className={styles.emptyIcon}>⏰</div>
          <p>No hay datos. Ve a <Link to="/carga_eventos" style={{ color: "#c084fc", textDecoration: "underline", fontWeight: "bold" }}>Cargar CSV</Link> primero.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
              <h3><span>🗓️</span> Heatmap Día × Hora</h3>
              <HeatmapEventos data={heatmapQ.data} />
            </div>
            <div className={styles.chartCard}>
              <h3><span>📊</span> Distribución por Hora (0-23h)</h3>
              <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                🟣 En horario (08-16h) | 🟠 Fuera de horario
              </p>
              <HistogramaHoras data={histQ.data} />
            </div>
          </div>
          <div className={`${styles.chartsGrid} ${styles.fullWidth}`}>
            <div className={styles.chartCard}>
              <h3><span>🌙</span> Eventos Fuera de Horario</h3>
              <TablaFueraHorario data={fueraQ.data?.tabla} kpi={fueraQ.data?.kpi} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
