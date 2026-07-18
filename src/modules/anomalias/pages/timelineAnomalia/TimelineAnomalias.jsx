import { useLocation } from "react-router";
import { useSelector } from "react-redux";
import styles from "./time.module.css";
import LineaDias from "../../components/linea_dias/LineaDias";
import AreaHoras from "../../components/area_horas/AreaHoras";
import HeatmapSemana from "./headmapsemana/HeatmapSemana";
import {
  usePorDiaAnomalias,
  useHeatmapAnomalias,
  usePorHoraAnomalias,
} from "../../../../api/apiAnomalias";

export default function TimelineAnomalias() {
  const location = useLocation();

  // Filtro global de fechas desde Redux
  const { fechaInicio, fechaFin } = useSelector((state) => state.FILTRO_FECHAS);
  const filtros = { fechaInicio, fechaFin };

  // Consultas con React Query
  const porDiaQuery = usePorDiaAnomalias(filtros);
  const heatmapQuery = useHeatmapAnomalias(filtros);
  const porHoraQuery = usePorHoraAnomalias(filtros);

  const loading =
    porDiaQuery.isLoading || heatmapQuery.isLoading || porHoraQuery.isLoading;

  const porDia = porDiaQuery.data || [];
  const heatmap = heatmapQuery.data || [];
  const porHora = porHoraQuery.data || [];

  const hasData = porDia.length > 0 || heatmap.length > 0;

  return (
    <div className={styles.content_time_semana}>
      <h1>Análisis Temporal de Anomalías</h1>
      <p className={styles.page_subtitle}>
        Distribución temporal — Tendencias por día y mapa de calor hora × día de
        la semana
      </p>

      {loading ? (
        <div className={styles.loading_container}>
          <div className={styles.spinner} />
          <p>Cargando datos temporales...</p>
        </div>
      ) : !hasData ? (
        <div className={styles.empty_state}>
          <div className={styles.empty_icon}>📅</div>
          <p>
            No hay datos temporales disponibles. Sube un archivo CSV desde el
            Dashboard para generar el análisis temporal.
          </p>
        </div>
      ) : (
        <>
          {/* Fila 1: Dos diagramas en grid de 2 columnas (Hora del Día y Por Día) */}
          <div className={styles.charts_grid}>
            <div className={styles.chart_card}>
              <h3>
                <span>📈</span> Anomalías por Hora del Día
              </h3>
              <AreaHoras data={porHora} />
            </div>
            <div className={styles.chart_card}>
              <h3>
                <span>📈</span> Anomalías por Día
              </h3>
              <LineaDias data={porDia} />
            </div>
          </div>

          {/* Fila 2: Mapa de Calor (Full Width) sin limitación de altura */}
          <div className={`${styles.charts_grid} ${styles.full_width}`}>
            <div className={styles.chart_card}>
              <h3>
                <span>🗓️</span> Mapa de Calor: Hora × Día de la Semana
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.78rem",
                  marginTop: "-0.4rem",
                  marginBottom: "0.5rem",
                }}
              >
                Intensidad de anomalías por hora del día y día de la semana
              </p>
              <HeatmapSemana data={heatmap} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

