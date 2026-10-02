import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router";
import styles from "./TablaIncidentes.module.css";
import dayjs from "dayjs";
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import {
  FaMagnifyingGlass,
  FaXmark,
  FaArrowRight,
  FaArrowsRotate,
  FaTriangleExclamation,
  FaArrowUp,
  FaArrowDown,
  FaSort,
  FaAngleLeft,
  FaAngleRight,
  FaAnglesLeft,
  FaAnglesRight,
  FaChevronDown,
  FaChevronUp,
  FaRotateLeft,
  FaClock,
} from "react-icons/fa6";
import RoleBadge from "../../../components/RoleBadge";

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

const getEstadoClass = (estado) => {
  switch (estado?.toLowerCase()) {
    case "abierto":
      return styles.estadoAbierto;
    case "en_investigacion":
      return styles.estadoEnInvestigacion;
    case "contenido":
      return styles.estadoContenido;
    case "mitigado":
      return styles.estadoMitigado;
    default:
      return styles.estadoFalsoPositivo;
  }
};

export default function TablaIncidentes({
  data,
  page = 1,
  setPage,
  pageSize = 10,
  setPageSize,
  filtros = {},
  setFiltros,
  resumen,
  onEjecutarCorrelacion,
  isExecuting = false,
  isLoading = false,
}) {
  const incidentes = useMemo(() => data?.incidentes || [], [data?.incidentes]);
  const total = data?.total || 0;
  const totalPaginas = data?.total_paginas || Math.max(1, Math.ceil(total / pageSize));

  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRowExpand = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const handleSearchChange = (e) => {
    setFiltros((prev) => ({ ...prev, busqueda: e.target.value }));
    setPage(1);
  };

  const handleClearSearch = () => {
    setFiltros((prev) => ({ ...prev, busqueda: "" }));
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFiltros((prev) => {
      const next = { ...prev, [key]: value };
      // Si se filtra por crítico o alto, resetear estado para evitar conflicto de contención
      if (key === "nivel_riesgo" && (value === "critico" || value === "alto")) {
        next.estado = "";
      }
      return next;
    });
    setPage(1);
  };

  const handleResetFilters = () => {
    setFiltros({
      busqueda: "",
      nivel_riesgo: "",
      estado: "",
      clasificacion: "",
      tipo_evento: "",
      mes: "",
    });
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    filtros.busqueda ||
    filtros.nivel_riesgo ||
    filtros.estado ||
    filtros.clasificacion ||
    filtros.tipo_evento ||
    filtros.mes,
  );

  // TanStack Table Column Definitions — Compact inline layout for optimal UX density
  const columns = useMemo(
    () => [
      {
        id: "id_fecha",
        accessorKey: "id",
        header: "ID / Fecha",
        meta: { align: "left", width: "17%" },
        cell: ({ row }) => {
          const inc = row.original;
          const dt = inc.fecha_deteccion ? dayjs(inc.fecha_deteccion) : null;
          return (
            <div className={styles.idFechaCell}>
              <span className={styles.idBadge}>ID_REG:{inc.id}</span>
              {dt ? (
                <span className={styles.fechaInline}>
                  {dt.format("DD/MM/YY")} <FaClock className={styles.fechaClockIcon} /> {dt.format("HH:mm")}
                </span>
              ) : (
                <span className={styles.fechaInline} style={{ color: "#9ca3af" }}>
                  N/A
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "documento",
        accessorKey: "numero_documento",
        header: "Documento",
        meta: { align: "left", width: "26%" },
        cell: ({ row }) => {
          const inc = row.original;
          return (
            <div className={styles.docCellCompact}>
              <div className={styles.docTopLine}>
                <span className={styles.docNum} title={`Doc #${inc.id_documento} (${inc.numero_documento || "S/N"})`}>
                  #{inc.id_documento}
                </span>
                {/* {inc.numero_documento && <span className={styles.docNumSec}>· {inc.numero_documento}</span>} */}
                <span className={`${styles.clasifBadge} ${getClasifClass(inc.clasificacion_doc)}`}>
                  {inc.clasificacion_doc || "COMUN"}
                </span>
                <span className={`${styles.docDestino} ${inc.destino_doc === "exterior" ? styles.docDestinoExt : ""}`}>
                  {inc.destino_doc === "exterior" ? "🌐" : "🏢"}
                </span>
                {inc.tipo_documento && <span className={styles.docTipo}>{inc.tipo_documento}</span>}
              </div>
            </div>
          );
        },
      },
      {
        id: "usuario",
        accessorKey: "nombre_usuario",
        header: "Usuario",
        meta: { align: "left", width: "23%" },
        cell: ({ row }) => {
          const inc = row.original;
          const initial = inc.nombre_usuario ? inc.nombre_usuario.charAt(0).toUpperCase() : "U";
          return (
            <div className={styles.userCellCompact}>
              
              <div className={styles.userInfoCompact}>
                <div className={styles.userMetaLine}>
                  <RoleBadge role={inc.name_role || inc.rol || inc.role} size="small" />
                  <div style={{ display: "flex", flexDirection: "row", gap: 5, alignItems: "center" }}>
                    <span className={styles.userName} title={inc.nombre_usuario}>
                      {inc.nombre_usuario || "Desconocido"}
                    </span>
                    <span className={styles.userId}>ID_USER: {inc.id_user}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "score_correlacion",
        header: "Score / Riesgo",
        meta: { align: "left", width: "16%" },
        cell: ({ row }) => {
          const inc = row.original;
          const score = Number(inc.score_correlacion || 0);
          const scorePercent = Math.min(100, Math.max(0, Math.round(score * 100)));
          const riesgo = (inc.nivel_riesgo || "bajo").toLowerCase();

          let barClass = styles.barBajo;
          if (riesgo === "critico") barClass = styles.barCritico;
          else if (riesgo === "alto") barClass = styles.barAlto;
          else if (riesgo === "medio") barClass = styles.barMedio;

          return (
            <div className={styles.scoreCellCompact}>
              <div className={styles.scoreTopRow}>
                <span className={styles.scoreVal}>{scorePercent}%</span>
                <div className={styles.scoreSubLine}>
                  T:{Math.round(Number(inc.score_trazabilidad || 0) * 100)}%{" · "}
                  E:{Math.round(Number(inc.score_eventos || 0) * 100)}%
                  {inc.total_pasos_storyline > 0 && ` · ${inc.total_pasos_storyline}p`}
                </div>
                <span className={`${styles.badgeRiesgo} ${getRiesgoClass(inc.nivel_riesgo)}`}>
                  {inc.nivel_riesgo || "Bajo"}
                </span>
              </div>
              <div className={styles.scoreBarWrapper}>
                <div className={`${styles.scoreBarFill} ${barClass}`} style={{ width: `${scorePercent}%` }} />
              </div>
            </div>
          );
        },
      },
      {
        id: "estado_accion",
        accessorKey: "estado",
        header: "Estado",
        meta: { align: "center", width: "6%" },
        cell: ({ row }) => {
          const inc = row.original;
          const estado = inc.estado || "abierto";
          const isExpanded = !!expandedRows[row.id];
          return (
            <div className={styles.estadoAccionCell}>
              <span className={`${styles.estadoBadge} ${getEstadoClass(estado)}`}>
                <span className={styles.statusDot} />
                {estado.replace(/_/g, " ")}
              </span>
            </div>
          );
        },
      },
      {
        id: "estado_accion",
        accessorKey: "accion_tomada",
        header: "Acción",
        meta: { align: "center", width: "6%" },
        cell: ({ row }) => {
          const inc = row.original;
          const estado = inc.estado || "abierto";
          const isExpanded = !!expandedRows[row.id];
          return (
            <div className={styles.estadoAccionCell}>
              <div className={styles.actionsBtnRow}>
                <button
                  type="button"
                  className={`${styles.btnExpandCompact} ${isExpanded ? styles.btnExpandActive : ""}`}
                  onClick={() => toggleRowExpand(row.id)}
                  title={isExpanded ? "Ocultar telemetría" : "Ver telemetría"}
                >
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                <Link to={`/incidentes/${inc.id}`} className={styles.btnDetalleCompact} title="Ver auditoría completa">
                  <FaArrowRight />
                </Link>
              </div>
            </div>
          );
        },
      },
    ],
    [expandedRows],
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: incidentes,
    columns,
    pageCount: totalPaginas,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize,
      },
      sorting,
    },
    manualPagination: true,
    onPaginationChange: (updater) => {
      const nextPagination = typeof updater === "function" ? updater({ pageIndex: page - 1, pageSize }) : updater;
      if (nextPagination.pageIndex !== undefined) {
        setPage(nextPagination.pageIndex + 1);
      }
      if (setPageSize && nextPagination.pageSize !== undefined && nextPagination.pageSize !== pageSize) {
        setPageSize(nextPagination.pageSize);
        setPage(1);
      }
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Calculate visible pagination pages with ellipsis
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(1, page - delta); i <= Math.min(totalPaginas, page + delta); i++) {
      range.push(i);
    }

    if (range[0] > 1) {
      rangeWithDots.push(1);
      if (range[0] > 2) rangeWithDots.push("...");
    }

    rangeWithDots.push(...range);

    if (range[range.length - 1] < totalPaginas) {
      if (range[range.length - 1] < totalPaginas - 1) rangeWithDots.push("...");
      rangeWithDots.push(totalPaginas);
    }

    return rangeWithDots;
  }, [page, totalPaginas]);

  // Page row counts
  const fromRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRecord = Math.min(page * pageSize, total);

  // Render header sort icon
  const renderSortIcon = (column) => {
    const isSorted = column.getIsSorted();
    if (isSorted === "asc") return <FaArrowUp className={styles.sortIcon} />;
    if (isSorted === "desc") return <FaArrowDown className={styles.sortIcon} />;
    if (column.getCanSort()) return <FaSort className={styles.sortIconNeutral} />;
    return null;
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
          {filtros.busqueda && (
            <button type="button" className={styles.searchClearBtn} onClick={handleClearSearch} title="Borrar búsqueda">
              <FaXmark />
            </button>
          )}
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

          {/* Tipo de Evento */}
          <select
            className={styles.select}
            value={filtros.tipo_evento || ""}
            onChange={(e) => handleFilterChange("tipo_evento", e.target.value)}
            title="Filtrar por tipo de evento dinámico según registros detectados"
          >
            <option value="">Todos los Eventos</option>
            {resumen?.tipos_eventos && resumen.tipos_eventos.filter((ev) => ev.cantidad > 0).length > 0 ? (
              resumen.tipos_eventos
                .filter((ev) => ev.cantidad > 0)
                .map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.nombre} ({ev.cantidad})
                  </option>
                ))
            ) : (
              <option value="VISTA" disabled>
                Sin Eventos Específicos
              </option>
            )}
          </select>

          {/* Limpiar Filtros */}
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.btnResetFilters}
              onClick={handleResetFilters}
              title="Limpiar todos los filtros"
            >
              <FaRotateLeft /> Limpiar
            </button>
          )}

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

      {/* Tabla de incidentes con TanStack Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const align = header.column.columnDef.meta?.align || "left";
                  const width = header.column.columnDef.meta?.width;

                  return (
                    <th
                      key={header.id}
                      className={`${styles.th} ${canSort ? styles.thSortable : ""}`}
                      style={{
                        width: width,
                        textAlign: align,
                      }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div
                        className={styles.thContent}
                        style={{
                          justifyContent: align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start",
                        }}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && renderSortIcon(header.column)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className={styles.loadingOverlay}>
                  <FaArrowsRotate className="spin" />
                  Cargando incidentes correlacionados...
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const isExpanded = !!expandedRows[row.id];
                const inc = row.original;
                const scoreTrazaPct = Math.round(Number(inc.score_trazabilidad || 0) * 100);
                const scoreEventosPct = Math.round(Number(inc.score_eventos || 0) * 100);

                return (
                  <Fragment key={row.id}>
                    {/* Fila Principal */}
                    <tr className={`${styles.tr} ${isExpanded ? styles.trExpanded : ""}`}>
                      {row.getVisibleCells().map((cell) => {
                        const align = cell.column.columnDef.meta?.align || "left";
                        return (
                          <td key={cell.id} className={styles.td} style={{ textAlign: align }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Fila Expandible Inline con Telemetría Forense */}
                    {isExpanded && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={columns.length} className={styles.expandedTd}>
                          <div className={styles.expandedContent}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "0.85rem",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: "#1e293b",
                                  fontSize: "0.88rem",
                                }}
                              >
                                ⚡ Telemetría Rápida — Incidente #{inc.id} ({inc.nombre_usuario || "Desconocido"})
                              </span>
                              <button
                                type="button"
                                className={styles.btnExpand}
                                onClick={() => toggleRowExpand(row.id)}
                                title="Cerrar telemetría"
                              >
                                <FaXmark />
                              </button>
                            </div>

                            <div className={styles.telemetryGrid}>
                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Score Trazabilidad Doc</div>
                                <div className={styles.telemetryValue}>{scoreTrazaPct}%</div>
                                <div className={styles.telemetrySub}>
                                  {inc.total_motivos_traza || 0} anomalías documentales
                                </div>
                              </div>

                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Score Eventos Usuario</div>
                                <div className={styles.telemetryValue}>{scoreEventosPct}%</div>
                                <div className={styles.telemetrySub}>
                                  {inc.total_motivos_eventos || 0} anomalías de conducta
                                </div>
                              </div>

                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Trazabilidad & Pasos</div>
                                <div className={styles.telemetryValue}>{inc.total_pasos_storyline || 0} pasos</div>
                                <div className={styles.telemetrySub}>Línea temporal reconstruida</div>
                              </div>

                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Sesiones de Auditoría</div>
                                <div className={styles.telemetrySub} style={{ marginTop: "0.2rem" }}>
                                  Doc: {inc.sesion_traza_id || "S/N"}
                                  <br />
                                  Eventos: {inc.sesion_eventos_id || "S/N"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className={styles.emptyState}>
                  <FaTriangleExclamation className={styles.emptyIcon} />
                  <div className={styles.emptyTitle}>No se encontraron incidentes</div>
                  <p className={styles.emptyText}>
                    No hay registros de fuga que coincidan con los filtros o parámetros de búsqueda aplicados.
                  </p>
                  {hasActiveFilters && (
                    <button type="button" className={styles.btnResetFilters} onClick={handleResetFilters}>
                      <FaRotateLeft /> Restablecer filtros
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador Avanzado TanStack Table */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Mostrando <span className={styles.paginationHighlight}>{fromRecord}</span> -{" "}
          <span className={styles.paginationHighlight}>{toRecord}</span> de{" "}
          <span className={styles.paginationHighlight}>{total}</span> incidentes
        </div>

        <div className={styles.paginationControls}>
          {/* Primera página */}
          <button className={styles.pagBtn} disabled={page <= 1} onClick={() => setPage(1)} title="Primera página">
            <FaAnglesLeft />
          </button>

          {/* Anterior */}
          <button
            className={styles.pagBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Página anterior"
          >
            <FaAngleLeft />
          </button>

          {/* Números de página */}
          {paginationRange.map((pageNum, idx) =>
            pageNum === "..." ? (
              <span key={`dots-${idx}`} className={styles.pagEllipsis}>
                ···
              </span>
            ) : (
              <button
                key={`page-${pageNum}`}
                className={`${styles.pagBtn} ${page === pageNum ? styles.pagBtnActive : ""}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            ),
          )}

          {/* Siguiente */}
          <button
            className={styles.pagBtn}
            disabled={page >= totalPaginas}
            onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
            title="Página siguiente"
          >
            <FaAngleRight />
          </button>

          {/* Última página */}
          <button
            className={styles.pagBtn}
            disabled={page >= totalPaginas}
            onClick={() => setPage(totalPaginas)}
            title="Última página"
          >
            <FaAnglesRight />
          </button>
        </div>

        {/* Selector de tamaño de página */}
        <div className={styles.pageSizeWrapper}>
          <span>Mostrar:</span>
          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              if (setPageSize) {
                setPageSize(newSize);
                setPage(1);
              }
            }}
          >
            {[10, 15, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} por pág.
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
