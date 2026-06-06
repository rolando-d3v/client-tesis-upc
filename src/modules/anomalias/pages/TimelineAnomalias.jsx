import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import "../anomalias.css";
import LineaDias from "../components/LineaDias";
import HeatmapSemana from "../components/HeatmapSemana";
import { getPorDia, getHeatmap } from "../../../api/apiAnomalias";

export default function TimelineAnomalias() {
  const location = useLocation();
  const [porDia, setPorDia] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [diasRes, heatmapRes] = await Promise.all([
          getPorDia(),
          getHeatmap(),
        ]);
        setPorDia(diasRes || []);
        setHeatmap(heatmapRes || []);
      } catch {
        setPorDia([]);
        setHeatmap([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasData = porDia.length > 0 || heatmap.length > 0;

  return (
    <div className="anomalias-page">
      <h1>📅 Análisis Temporal de Anomalías</h1>
      <p className="page-subtitle">
        Distribución temporal — Tendencias por día y mapa de calor hora × día de la semana
      </p>

      {/* Navegación */}
      <nav className="dashboard-nav">
        <Link to="/anomalias" className={location.pathname === "/anomalias" ? "active" : ""}>
          📊 Resumen Ejecutivo
        </Link>
        <Link to="/anomalias/tabla" className={location.pathname === "/anomalias/tabla" ? "active" : ""}>
          📋 Tabla Anomalías
        </Link>
        <Link to="/anomalias/timeline" className={location.pathname === "/anomalias/timeline" ? "active" : ""}>
          📅 Análisis Temporal
        </Link>
      </nav>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Cargando datos temporales...</p>
        </div>
      ) : !hasData ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>
            No hay datos temporales disponibles. Sube un archivo CSV desde el
            Dashboard para generar el análisis temporal.
          </p>
        </div>
      ) : (
        <>
          {/* Line Chart: Anomalías por día */}
          <div className="charts-grid full-width">
            <div className="chart-card">
              <h3><span>📈</span> Anomalías por Día</h3>
              <LineaDias data={porDia} />
            </div>
          </div>

          {/* Heatmap: Hora × Día de la semana */}
          <div className="charts-grid full-width">
            <div className="chart-card">
              <h3><span>🗓️</span> Mapa de Calor: Hora × Día de la Semana</h3>
              <p style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
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
