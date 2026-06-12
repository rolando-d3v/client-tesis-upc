import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useSelector } from "react-redux";
import "../anomalias.css";
import { useDetalleAnomalias } from "../../../api/apiAnomalias";

function getBadgeClass(clasificacion) {
  const c = clasificacion?.toLowerCase();
  if (c === "secreto") return "badge badge-secreto";
  if (c === "reservado") return "badge badge-reservado";
  if (c === "confidencial") return "badge badge-confidencial";
  return "badge badge-comun";
}

function getScoreClass(score) {
  if (score < -0.05) return "score-cell critical";
  if (score < -0.02) return "score-cell warning";
  return "score-cell low";
}

export default function TablaAnomalias() {
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [filterClasif, setFilterClasif] = useState("");
  const limit = 20;

  // Filtro global de fechas desde Redux
  const { fechaInicio, fechaFin } = useSelector(
    (state) => state.FILTRO_FECHAS
  );

  // Resetear a página 1 cuando cambian las fechas
  useEffect(() => {
    setPage(1);
  }, [fechaInicio, fechaFin]);

  // Consulta con React Query
  const { data: result, isLoading: loading } = useDetalleAnomalias(page, limit, {
    fechaInicio,
    fechaFin,
  });

  const data = result?.data || [];
  const totalPages = result?.total_pages || 0;
  const total = result?.total || 0;

  const filteredData = filterClasif
    ? data.filter((d) => d.clasificacion === filterClasif)
    : data;

  return (
    <div className="anomalias-page">
      <h1>📋 Registros Anómalos Detectados</h1>
      <p className="page-subtitle">
        Tabla detallada con filtros y paginación — Ordenados por severidad
      </p>

      {/* Navegación */}
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

      {/* Filtros */}
      <div className="filters-row">
        <select
          className="filter-select"
          value={filterClasif}
          onChange={(e) => setFilterClasif(e.target.value)}
        >
          <option value="">Todas las clasificaciones</option>
          <option value="SECRETO">SECRETO</option>
          <option value="RESERVADO">RESERVADO</option>
          <option value="CONFIDENCIAL">CONFIDENCIAL</option>
          <option value="COMUN">COMUN</option>
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>Cargando registros...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>
            No hay anomalías registradas aún. Sube un archivo CSV desde el Dashboard
            para iniciar el análisis.
          </p>
        </div>
      ) : (
        <div className="anomalias-table-wrapper">
          <table className="anomalias-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ID Registro</th>
                <th>Usuario</th>
                <th>Oficina Origen</th>
                <th>Oficina Destino</th>
                <th>Clasificación</th>
                <th>Peso (MB)</th>
                <th>Estado</th>
                <th>Tipo Doc.</th>
                <th>Destino</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={`${item.id_registro}-${index}`}>
                  <td>{(page - 1) * limit + index + 1}</td>
                  <td>{item.id_registro}</td>
                  <td>{item.usuario}</td>
                  <td>{item.oficina_origen}</td>
                  <td>{item.oficina_destino}</td>
                  <td>
                    <span className={getBadgeClass(item.clasificacion)}>
                      {item.clasificacion}
                    </span>
                  </td>
                  <td>{item.peso_mb}</td>
                  <td>{item.estado}</td>
                  <td>{item.tipo_documento}</td>
                  <td>{item.destino}</td>
                  <td className={getScoreClass(item.score)}>
                    {item.score?.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="pagination">
            <span className="page-info">
              Mostrando {(page - 1) * limit + 1}–
              {Math.min(page * limit, total)} de {total} anomalías
            </span>
            <div className="pagination-btns">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Anterior
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p;
                if (totalPages <= 5) {
                  p = i + 1;
                } else if (page <= 3) {
                  p = i + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    className={page === p ? "active" : ""}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
