import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import style from "./dashboard.module.css";


import CardResumen from "../../../components/card_resumen/CardResumen";
import CardCalidadDataset from "../../../components/card_calidad_dataset/CardCalidadDataset";
import DonutClasificacion from "../../../components/donut_clasificacion/DonutClasificacion";
import BarrasOficinas from "../../../components/barras_oficinas/BarrasOficinas";
import ScatterScores from "../../../components/scatter_scores/ScatterScores";
import {
  useResumenAnomalias,
  usePorClasificacionAnomalias,
  usePorOficinaAnomalias,
  useScoresAnomalias,
  useCalidadDataset,
} from "../../../../../api/apiAnomalias";

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
  const porOficinaQuery = usePorOficinaAnomalias(filtros);
  const scoresQuery = useScoresAnomalias(filtros);
  const calidadQuery = useCalidadDataset();

  const loading =
    resumenQuery.isLoading ||
    clasificacionQuery.isLoading ||
    porOficinaQuery.isLoading ||
    scoresQuery.isLoading;

  const hasData = resumenQuery.data && resumenQuery.data.total_registros > 0;

  const data = hasData
    ? {
        resumen: resumenQuery.data,
        anomalias_por_clasificacion: clasificacionQuery.data || [],
        anomalias_por_oficina: porOficinaQuery.data || [],
        scores_data: scoresQuery.data || [],
      }
    : null;

  const resumen = data?.resumen;

  return (
    <div className={style['anomalias-page']}>
      <h1>Sistema de Detección de Filtración de Info Clasificada</h1>
      <p className={style['page-subtitle']}>
        Pipeline Isolation Forest — Detección de anomalías en trazabilidad de documentos
      </p>

   
      {/* Processing overlay */}
      {loading && (
        <div className={style['processing-overlay']}>
          <div className={style.spinner} />
          <p>Cargando datos del Dashboard...</p>
        </div>
      )}

      {/* Estado vacío */}
      {!data && !loading && (
        <div className={style['empty-state']}>
          <div className={style['empty-icon']}>🤖</div>
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
          <div className={style['cards-grid']}>
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

          {/* ICD — Índice de Calidad del Dataset */}
          {calidadQuery.data && (
            <CardCalidadDataset
              original={calidadQuery.data.calidad_dataset_original}
              procesado={calidadQuery.data.calidad_dataset_procesado}
            />
          )}

          {/* Gráficos fila 1: Donut + Barras */}
          <div className={style['charts-grid']}>
            <div className={style['chart-card']}>
              <h3><span>🍩</span> Anomalías por Clasificación</h3>
              <DonutClasificacion data={data.anomalias_por_clasificacion} />
            </div>
            <div className={style['chart-card']}>
              <h3><span>📊</span> Top Oficinas con más Anomalías</h3>
              <BarrasOficinas data={data.anomalias_por_oficina} />
            </div>
          </div>

          {/* Gráficos fila 3: Scatter (full width) */}
          <div className={`${style['charts-grid']} ${style['full-width']}`}>
            <div className={style['chart-card']}>
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
