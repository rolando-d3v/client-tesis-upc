import { Link } from "react-router";
import styles from "./TablaIncidentes.module.css";
import dayjs from "dayjs";
import {
  FaMagnifyingGlass,
  FaArrowRight,
  FaArrowsRotate,
  FaTriangleExclamation,
} from "react-icons/fa6";

const getClasifClass = (clasif) => {
  switch (clasif?.toUpperCase()) {
    case "SECRETO":
      return styles.clasifSecreto;
    case "RESERVADO":
      return styles.clasifReservado;
    case "CONFIDENCIAL":
      return styles.clasifConfidencial;
    default:
      return styles.clasifComun;
  }
};

const getRiesgoClass = (nivel) => {
  switch (nivel?.toLowerCase()) {
    case "critico":
      return styles.riesgoCritico;
    case "alto":
      return styles.riesgoAlto;
    case "medio":
      return styles.riesgoMedio;
    default:
      return styles.riesgoBajo;
  }
};

export default function TablaIncidentes({
  data,
  page,
  setPage,
  filtros,
  setFiltros,
  onEjecutarCorrelacion,
  isExecuting,
}) {
  const incidentes = data?.incidentes || [];
  const total = data?.total || 0;
  const totalPaginas = data?.total_paginas || 1;

  const handleSearchChange = (e) => {
    setFiltros((prev) => ({ ...prev, busqueda: e.target.value }));
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className={styles.container}>
      {/* Barra de control y filtros */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <FaMagnifyingGlass className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por usuario, documento o DNI..."
            value={filtros.busqueda || ""}
            onChange={handleSearchChange}
          />
        </div>

        <div className={styles.filtersGroup}>
          {/* Nivel de Riesgo */}
          <select
            className={styles.select}
            value={filtros.nivel_riesgo || ""}
            onChange={(e) => handleFilterChange("nivel_riesgo", e.target.value)}
          >
            <option value="">Todos los Riesgos</option>
            <option value="critico">Crítico</option>
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>

          {/* Estado */}
          <select
            className={styles.select}
            value={filtros.estado || ""}
            onChange={(e) => handleFilterChange("estado", e.target.value)}
          >
            <option value="">Todos los Estados</option>
            <option value="abierto">Abierto</option>
            <option value="en_investigacion">En Investigación</option>
            <option value="contenido">Contenido</option>
            <option value="mitigado">Mitigado</option>
            <option value="falso_positivo">Falso Positivo</option>
          </select>

          {/* Clasificación */}
          <select
            className={styles.select}
            value={filtros.clasificacion || ""}
            onChange={(e) => handleFilterChange("clasificacion", e.target.value)}
          >
            <option value="">Todas las Clasificaciones</option>
            <option value="SECRETO">SECRETO</option>
            <option value="RESERVADO">RESERVADO</option>
            <option value="CONFIDENCIAL">CONFIDENCIAL</option>
            <option value="COMUN">COMUN</option>
          </select>

          {/* Re-ejecutar */}
          <button
            className={styles.btnEjecutar}
            disabled={isExecuting}
            onClick={onEjecutarCorrelacion}
            title="Re-ejecutar motor de correlación cruzada"
          >
            <FaArrowsRotate className={isExecuting ? "spin" : ""} />
            {isExecuting ? "Correlacionando..." : "Sincronizar Amenazas"}
          </button>
        </div>
      </div>

      {/* Tabla de incidentes */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ID</th>
              <th className={styles.th}>Fecha Detección</th>
              <th className={styles.th}>Documento Afectado</th>
              <th className={styles.th}>Usuario Involucrado</th>
              <th className={styles.th}>Score Correlación</th>
              <th className={styles.th}>Storyline</th>
              <th className={styles.th}>Estado</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {incidentes.length > 0 ? (
              incidentes.map((inc) => {
                const dt = inc.fecha_deteccion
                  ? dayjs(inc.fecha_deteccion).format("DD/MM/YYYY HH:mm")
                  : "N/A";
                const score = Number(inc.score_correlacion || 0);

                return (
                  <tr key={inc.id} className={styles.tr}>
                    <td className={styles.td} style={{ fontWeight: 700, color: "#6b7280" }}>
                      #{inc.id}
                    </td>

                    <td className={styles.td} style={{ whiteSpace: "nowrap" }}>
                      {dt}
                    </td>

                    <td className={styles.td}>
                      <div className={styles.docCell}>
                        <span className={styles.docNum}>
                          Doc #{inc.id_documento} ({inc.numero_documento || "S/N"})
                        </span>
                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                          <span className={`${styles.clasifBadge} ${getClasifClass(inc.clasificacion_doc)}`}>
                            {inc.clasificacion_doc || "COMUN"}
                          </span>
                          <span className={styles.docSub}>
                            {inc.destino_doc === "exterior" ? "🌐 Exterior" : "🏢 Interior"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div className={styles.userCell}>
                        <span className={styles.userName}>{inc.nombre_usuario || "Desconocido"}</span>
                        <span className={styles.userId}>ID: {inc.id_user}</span>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div className={styles.scoreCell}>
                        <span className={styles.scoreVal}>
                          {(score * 100).toFixed(0)}%
                        </span>
                        <span className={`${styles.badgeRiesgo} ${getRiesgoClass(inc.nivel_riesgo)}`}>
                          {inc.nivel_riesgo}
                        </span>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <span style={{ fontSize: "0.82rem", color: "#4b5563" }}>
                        {inc.total_pasos_storyline || 0} pasos
                      </span>
                    </td>

                    <td className={styles.td}>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          textTransform: "capitalize",
                          color: inc.estado === "abierto" ? "#dc2626" : "#2563eb",
                        }}
                      >
                        {inc.estado?.replace("_", " ") || "Abierto"}
                      </span>
                    </td>

                    <td className={styles.td} style={{ textAlign: "right" }}>
                      <Link to={`/incidentes/${inc.id}`} className={styles.btnDetalle}>
                        Auditoría <FaArrowRight />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  <FaTriangleExclamation style={{ fontSize: "2rem", marginBottom: "0.5rem" }} />
                  <p>No se encontraron incidentes que coincidan con los filtros aplicados.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador */}
      <div className={styles.pagination}>
        <span>
          Mostrando página {page} de {totalPaginas} ({total} incidentes en total)
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={styles.pagBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <button
            className={styles.pagBtn}
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
