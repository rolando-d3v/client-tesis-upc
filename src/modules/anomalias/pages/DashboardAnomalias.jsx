import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import "../anomalias.css";

import CardResumen from "../components/CardResumen";
import DonutClasificacion from "../components/DonutClasificacion";
import BarrasOficinas from "../components/BarrasOficinas";
import AreaHoras from "../components/AreaHoras";
import ScatterScores from "../components/ScatterScores";
import {
  useResumenAnomalias,
  usePorClasificacionAnomalias,
  usePorHoraAnomalias,
  usePorOficinaAnomalias,
  useScoresAnomalias,
} from "../../../api/apiAnomalias";

export default function DashboardAnomalias() {
  const location = useLocation();

  // Filtro global de fechas desde Redux
  const { fechaInicio, fechaFin } = useSelector(
    (state) => state.FILTRO_FECHAS
  );
  const filtros = { fechaInicio, fechaFin };

  // Consultas con React Query
  const resumenQuery = useResumenAnomalias(filtros);
  const clasificacionQuery = usePorClasificacionAnomalias(filtros);
  const porHoraQuery = usePorHoraAnomalias(filtros);
  const porOficinaQuery = usePorOficinaAnomalias(filtros);
  const scoresQuery = useScoresAnomalias(filtros);

  const loading =
    resumenQuery.isLoading ||
    clasificacionQuery.isLoading ||
    porHoraQuery.isLoading ||
    porOficinaQuery.isLoading ||
    scoresQuery.isLoading;

  const hasData = resumenQuery.data && resumenQuery.data.total_registros > 0;

  const data = hasData
    ? {
        resumen: resumenQuery.data,
        anomalias_por_clasificacion: clasificacionQuery.data || [],
        anomalias_por_hora: porHoraQuery.data || [],
        anomalias_por_oficina: porOficinaQuery.data || [],
        scores_data: scoresQuery.data || [],
      }
    : null;

  const resumen = data?.resumen;

  return (
    <div className="anomalias-page">
      <h1>🔍 Sistema de Detección de Filtración de Info Clasificada</h1>
      <p className="page-subtitle">
        Pipeline Isolation Forest — Detección de anomalías en trazabilidad de documentos
      </p>

      {/* Navegación entre dashboards */}
      <nav className="dashboard-nav">
        <Link to="/carga_anomalias" className={location.pathname === "/carga_anomalias" ? "active" : ""}>
          📥 Cargar CSV
        </Link>
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

      {/* Processing overlay */}
      {loading && (
        <div className="processing-overlay">
          <div className="spinner" />
          <p>Cargando datos del Dashboard...</p>
        </div>
      )}

      {/* Estado vacío */}
      {!data && !loading && (
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <p>
            No hay datos cargados aún. Por favor, ve a la sección de{" "}
            <Link to="/carga_anomalias" style={{ color: "#c084fc", textDecoration: "underline", fontWeight: "bold" }}>
              Cargar CSV
            </Link>{" "}
            para subir un archivo de trazabilidad y comenzar el análisis.
          </p>
        </div>
      )}

      {/* Dashboard con datos */}
      {data && (
        <>
          {/* Cards de resumen */}
          <div className="cards-grid">
            <CardResumen
              icon="total"
              label="Total Registros"
              value={resumen.total_registros.toLocaleString()}
              sub="Registros analizados"
            />
            <CardResumen
              icon="anomalias"
              label="Anomalías Detectadas"
              value={resumen.total_anomalias.toLocaleString()}
              sub={`${resumen.porcentaje_anomalias}% del total`}
            />
            <CardResumen
              icon="porcentaje"
              label="Porcentaje de Riesgo"
              value={`${resumen.porcentaje_anomalias}%`}
              sub="Tasa de anomalías"
            />
            <CardResumen
              icon="secreto"
              label="Docs SECRETO"
              value={resumen.docs_secreto_anomalias.toLocaleString()}
              sub="En anomalías detectadas"
            />
          </div>

          {/* Gráficos fila 1: Donut + Barras */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3><span>🍩</span> Anomalías por Clasificación</h3>
              <DonutClasificacion data={data.anomalias_por_clasificacion} />
            </div>
            <div className="chart-card">
              <h3><span>📊</span> Top Oficinas con más Anomalías</h3>
              <BarrasOficinas data={data.anomalias_por_oficina} />
            </div>
          </div>

          {/* Gráficos fila 2: Area chart (full width) */}
          <div className="charts-grid full-width">
            <div className="chart-card">
              <h3><span>📈</span> Anomalías por Hora del Día</h3>
              <AreaHoras data={data.anomalias_por_hora} />
            </div>
          </div>

          {/* Gráficos fila 3: Scatter (full width) */}
          <div className="charts-grid full-width">
            <div className="chart-card">
              <h3><span>🔴</span> Score de Anomalía por Registro</h3>
              <p style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
                Puntos rojos = anomalías detectadas | Puntos grises = registros normales
              </p>
              <ScatterScores data={data.scores_data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
