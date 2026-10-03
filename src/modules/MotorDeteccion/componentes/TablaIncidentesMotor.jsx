import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router";
import styles from "../../entrenamiento/componentes/TablaIncidentes.module.css";
import liveStyles from "./TablaIncidentesMotor.module.css";
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
  FaFolderOpen,
  FaBolt,
  FaShieldHalved,
  FaBan,
} from "react-icons/fa6";
import RoleBadge from "../../../components/RoleBadge";
import ModalExpedienteForense from "./ModalExpedienteForense";
import { evaluarEstadoForense } from "../telemetria";

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

export default function TablaIncidentesMotor({
  data,
  incidentesEnVivo = [],
  neutralizadosIds = [],
  page = 1,
  setPage,
  pageSize = 10,
  setPageSize,
  filtros = {},
  setFiltros,
  resumen,
  isLoading = false,
  detalleBasePath = "/eventos/motor-deteccion/incidente",
}) {
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedIncidenteForense, setSelectedIncidenteForense] = useState(null);

  // Combinar incidentes persistidos en base de datos con incidentes capturados en vivo
  // y normalizar estado a 'contenido' y cuenta bloqueada para incidentes críticos según constantes.py
  const incidentesCombinados = useMemo(() => {
    const persistidos = data?.incidentes || [];
    const idsPersistidos = new Set(persistidos.map((i) => String(i.id)));

    // Filtrar los en vivo que aún no estén en base de datos para no duplicar
    const vivosNuevos = incidentesEnVivo.filter((i) => !idsPersistidos.has(String(i.id)));

    // Los incidentes en vivo van al inicio con prioridad
    // Y a todos se les evalúa su estado forense según constantes.py (score >= 0.75 / UMBRAL_CRITICO)
    const listaCompleta = [...vivosNuevos, ...persistidos].map((inc) => {
      const evalForense = evaluarEstadoForense(inc, neutralizadosIds);
      return {
        ...inc,
        estado: evalForense.estadoEfectivo,
        cuenta_bloqueada: evalForense.esBloqueado,
        es_critico_auto: evalForense.esCritico,
      };
    });

    // Aplicar filtros en memoria para los elementos en vivo y combinados
    return listaCompleta.filter((inc) => {
      if (filtros.nivel_riesgo && String(inc.nivel_riesgo).toLowerCase() !== String(filtros.nivel_riesgo).toLowerCase()) {
        return false;
      }
      if (filtros.estado && String(inc.estado).toLowerCase() !== String(filtros.estado).toLowerCase()) {
        return false;
      }
      if (filtros.clasificacion && String(inc.clasificacion_doc).toUpperCase() !== String(filtros.clasificacion).toUpperCase()) {
        return false;
      }
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        const coincideUsuario = inc.nombre_usuario?.toLowerCase().includes(q) || String(inc.id_user).includes(q);
        const coincideDoc = inc.numero_documento?.toLowerCase().includes(q) || String(inc.id_documento).includes(q);
        const coincideId = String(inc.id).toLowerCase().includes(q);
        if (!coincideUsuario && !coincideDoc && !coincideId) return false;
      }
      return true;
    });
  }, [data?.incidentes, incidentesEnVivo, filtros, neutralizadosIds]);

  const total = incidentesCombinados.length > (data?.total || 0) ? incidentesCombinados.length : data?.total || 0;
  const totalPaginas = data?.total_paginas || Math.max(1, Math.ceil(total / pageSize));

  // Paginación en cliente sobre los combinados si hay elementos en vivo
  const incidentesPaginados = useMemo(() => {
    if (incidentesEnVivo.length > 0) {
      const inicio = (page - 1) * pageSize;
      return incidentesCombinados.slice(inicio, inicio + pageSize);
    }
    return incidentesCombinados;
  }, [incidentesCombinados, incidentesEnVivo.length, page, pageSize]);

  const toggleRowExpand = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const handleSearchChange = (e) => {
    setFiltros((prev) => ({ ...prev, busqueda: e.target.value }));
    if (setPage) setPage(1);
  };

  const handleClearSearch = () => {
    setFiltros((prev) => ({ ...prev, busqueda: "" }));
    if (setPage) setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFiltros((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "nivel_riesgo" && (value === "critico" || value === "alto")) {
        next.estado = "";
      }
      return next;
    });
    if (setPage) setPage(1);
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
    if (setPage) setPage(1);
  };

  const hasActiveFilters = Boolean(
    filtros.busqueda ||
      filtros.nivel_riesgo ||
      filtros.estado ||
      filtros.clasificacion ||
      filtros.tipo_evento ||
      filtros.mes
  );

  // Columnas TanStack Table
  const columns = useMemo(
    () => [
      {
        id: "id_fecha",
        accessorKey: "id",
        header: "ID / Detección",
        meta: { align: "left", width: "19%" },
        cell: ({ row }) => {
          const inc = row.original;
          const dt = inc.fecha_deteccion ? dayjs(inc.fecha_deteccion) : null;
          return (
            <div className={styles.idFechaCell}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <span className={styles.idBadge}>#{inc.id}</span>
                {inc.es_en_vivo && (
                  <span className={liveStyles.liveBadge} title="Detectado en vivo en la simulación activa">
                    <span className={liveStyles.liveDot} /> En Vivo
                  </span>
                )}
              </div>
              {dt ? (
                <span className={styles.fechaInline}>
                  {dt.format("DD/MM/YY")} <FaClock className={styles.fechaClockIcon} /> {dt.format("HH:mm:ss")}
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
        header: "Documento Involucrado",
        meta: { align: "left", width: "24%" },
        cell: ({ row }) => {
          const inc = row.original;
          return (
            <div className={styles.docCellCompact}>
              <div className={styles.docTopLine}>
                <span className={styles.docNum} title={`Doc #${inc.id_documento} (${inc.numero_documento || "S/N"})`}>
                  #{inc.id_documento}
                </span>
                <span className={`${styles.clasifBadge} ${getClasifClass(inc.clasificacion_doc)}`}>
                  {inc.clasificacion_doc || "COMUN"}
                </span>
                {inc.tipo_documento && <span className={styles.docTipo}>{inc.tipo_documento}</span>}
                <span className={`${styles.docDestino} ${inc.destino_doc === "exterior" ? styles.docDestinoExt : ""}`}>
                  {inc.destino_doc === "exterior" ? "- EXT" : "- INT"}
                </span>
              </div>
              {/* {inc.numero_documento && (
                <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.15rem" }}>
                  {inc.numero_documento}
                </div>
              )} */}
            </div>
          );
        },
      },
      {
        id: "usuario",
        accessorKey: "nombre_usuario",
        header: "Usuario (Expediente)",
        meta: { align: "left", width: "34%" },
        cell: ({ row }) => {
          const inc = row.original;
          const isBloqueado = inc.cuenta_bloqueada;
          return (
            <div
              className={liveStyles.userCellClickable}
              onClick={() => setSelectedIncidenteForense(inc)}
              title="Click para abrir Expediente Forense Completo del usuario"
            >
              <div className={styles.userInfoCompact} style={{ width: "100%" }}>
                <div className={styles.userMetaLine}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginRight: "0.4rem", flexWrap: "wrap" }}>
                  {isBloqueado ? (
                    <span className={liveStyles.badgeBloqueado} title="Cuenta bloqueada y neutralizada en tiempo real según constantes.py (Score >= 0.75 / UMBRAL_CRITICO)">
                      <FaBan /> Cuenta Bloqueada
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.72rem", color: "#10b981", display: "inline-flex", alignItems: "center", gap: 3 }}>
                      ● Cuenta Activa
                    </span>
                  )}
                
                </div>
                  <RoleBadge role={inc.name_role || inc.rol || inc.role} size="small" />
                  <div style={{ display: "flex", flexDirection: "row", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={styles.userName} title={inc.nombre_usuario}>
                      {inc.nombre_usuario || "Desconocido"}
                    </span>
                    <span className={styles.userId}>ID:{inc.id_user}</span>
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
                  T:{Math.round(Number(inc.score_trazabilidad || 0) * 100)}% · E:{Math.round(Number(inc.score_eventos || 0) * 100)}%
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
        id: "estado",
        accessorKey: "estado",
        header: "Estado",
        meta: { align: "center", width: "10%" },
        cell: ({ row }) => {
          const inc = row.original;
          const estado = inc.estado || "abierto";
          const esCritico = inc.es_critico_auto || inc.nivel_riesgo === "critico" || Number(inc.score_correlacion || 0) >= 0.75;
          return (
            <div className={styles.estadoAccionCell}>
              <span className={`${styles.estadoBadge} ${getEstadoClass(estado)}`}>
                <span className={styles.statusDot} />
                {estado.replace(/_/g, " ")}
              </span>
              {esCritico && estado === "contenido" && (
                <span className={liveStyles.badgeContenidoTag} title="Contenido preventivamente en tiempo real según constantes.py (Score >= 0.75 / UMBRAL_CRITICO)">
                  <FaShieldHalved /> Auto-Contenido
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "acciones",
        header: "Acción",
        meta: { align: "center", width: "8%" },
        cell: ({ row }) => {
          const inc = row.original;
          const isExpanded = !!expandedRows[row.id];
          return (
            <div className={styles.estadoAccionCell}>
              <div className={styles.actionsBtnRow}>
                {/* Botón para expandir telemetría inline */}
                <button
                  type="button"
                  className={`${styles.btnExpandCompact} ${isExpanded ? styles.btnExpandActive : ""}`}
                  onClick={() => toggleRowExpand(row.id)}
                  title={isExpanded ? "Ocultar telemetría" : "Ver telemetría rápida"}
                >
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {/* Botón Expediente Forense Modal */}
                <button
                  type="button"
                  className={liveStyles.btnExpedienteLink}
                  onClick={() => setSelectedIncidenteForense(inc)}
                  title="Abrir expediente forense completo"
                >
                  <FaFolderOpen />
                </button>

                {/* Enlace directo a página dedicada */}
                {/* <Link
                  to={`${detalleBasePath}/${inc.id}`}
                  className={styles.btnDetalleCompact}
                  title="Ver expediente en página dedicada"
                >
                  <FaArrowRight />
                </Link> */}
              </div>
            </div>
          );
        },
      },
    ],
    [expandedRows, detalleBasePath]
  );

  const table = useReactTable({
    data: incidentesPaginados,
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
      if (nextPagination.pageIndex !== undefined && setPage) {
        setPage(nextPagination.pageIndex + 1);
      }
      if (nextPagination.pageSize !== undefined && setPageSize) {
        setPageSize(nextPagination.pageSize);
      }
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const renderSortIcon = (column) => {
    const isSorted = column.getIsSorted();
    if (isSorted === "asc") return <FaArrowUp className={styles.sortIcon} />;
    if (isSorted === "desc") return <FaArrowDown className={styles.sortIcon} />;
    return <FaSort className={styles.sortIconPlaceholder} />;
  };

  const fromRecord = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const toRecord = Math.min(page * pageSize, total);

  return (
    <div className={styles.container}>
      {/* Barra de Filtros y Búsqueda */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <FaMagnifyingGlass className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por usuario, ID o documento..."
            value={filtros.busqueda || ""}
            onChange={handleSearchChange}
          />
          {filtros.busqueda && (
            <button
              type="button"
              className={styles.searchClearBtn}
              onClick={handleClearSearch}
              title="Borrar búsqueda"
            >
              <FaXmark />
            </button>
          )}
        </div>

        <div className={styles.filtersGroup}>
          {incidentesEnVivo.length > 0 && (
            <span className={liveStyles.counterStreaming}>
              <FaBolt style={{ color: "#10b981" }} />
              {incidentesEnVivo.length} en vivo en simulación
            </span>
          )}

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
            title="Filtrar por tipo de evento dinámico"
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
        </div>
      </div>

      {/* Tabla con TanStack Table */}
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
            {isLoading && incidentesCombinados.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.loadingOverlay}>
                  <FaArrowsRotate className="spin" />
                  Cargando expediente forense del motor...
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
                    <tr
                      className={`${styles.tr} ${isExpanded ? styles.trExpanded : ""} ${
                        inc.es_en_vivo ? liveStyles.trLive : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const align = cell.column.columnDef.meta?.align || "left";
                        return (
                          <td key={cell.id} className={styles.td} style={{ textAlign: align }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Fila Expandible Inline con Telemetría Forense Rápida */}
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
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <FaShieldHalved style={{ color: "#7c3aed" }} />
                                Telemetría Rápida — Incidente #{inc.id} ({inc.nombre_usuario || "Desconocido"})
                              </span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                  type="button"
                                  className={liveStyles.btnExpedienteLink}
                                  onClick={() => setSelectedIncidenteForense(inc)}
                                >
                                  <FaFolderOpen /> Abrir Expediente Completo
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnExpand}
                                  onClick={() => toggleRowExpand(row.id)}
                                  title="Cerrar telemetría"
                                >
                                  <FaXmark />
                                </button>
                              </div>
                            </div>

                            <div className={styles.telemetryGrid}>
                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Score Trazabilidad Doc</div>
                                <div className={styles.telemetryValue}>{scoreTrazaPct}%</div>
                                <div className={styles.telemetrySub}>
                                  {inc.total_motivos_traza || inc.motivos_trazabilidad?.length || 0} anomalías documentales
                                </div>
                              </div>

                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Score Conductual Usuario</div>
                                <div className={styles.telemetryValue}>{scoreEventosPct}%</div>
                                <div className={styles.telemetrySub}>
                                  {inc.total_motivos_eventos || inc.motivos_eventos?.length || 0} anomalías de conducta
                                </div>
                              </div>

                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Trazabilidad & Pasos</div>
                                <div className={styles.telemetryValue}>
                                  {inc.total_pasos_storyline || inc.storyline?.length || 0} pasos
                                </div>
                                <div className={styles.telemetrySub}>Línea temporal reconstruida</div>
                              </div>

                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Estado SOC & Cuenta</div>
                                <div className={styles.telemetryValue} style={{ fontSize: "0.86rem", display: "flex", alignItems: "center", gap: 5, marginTop: "0.2rem" }}>
                                  {inc.cuenta_bloqueada ? (
                                    <span style={{ color: "#dc2626", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                      <FaBan /> Cuenta Bloqueada
                                    </span>
                                  ) : (
                                    <span style={{ color: "#059669", fontWeight: 600 }}>
                                      ● Cuenta Activa
                                    </span>
                                  )}
                                </div>
                                <div className={styles.telemetrySub}>
                                  {inc.es_critico_auto ? "Auto-Contenido (Score ≥ 75%)" : `Estado: ${inc.estado}`}
                                </div>
                              </div>

                              <div className={styles.telemetryCard}>
                                <div className={styles.telemetryLabel}>Sesiones Auditadas</div>
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
                    No hay incidentes que coincidan con los filtros aplicados o aún no se han registrado eventos anómalos en la simulación.
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

      {/* Paginación */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Mostrando <span className={styles.paginationHighlight}>{fromRecord}</span> -{" "}
          <span className={styles.paginationHighlight}>{toRecord}</span> de{" "}
          <span className={styles.paginationHighlight}>{total}</span> incidentes
        </div>

        <div className={styles.paginationControls}>
          <button
            className={styles.pagBtn}
            disabled={page <= 1}
            onClick={() => setPage && setPage(1)}
            title="Primera página"
          >
            <FaAnglesLeft />
          </button>
          <button
            className={styles.pagBtn}
            disabled={page <= 1}
            onClick={() => setPage && setPage((p) => Math.max(1, p - 1))}
            title="Página anterior"
          >
            <FaAngleLeft />
          </button>

          <span className={styles.pagCurrent}>
            Página {page} de {totalPaginas}
          </span>

          <button
            className={styles.pagBtn}
            disabled={page >= totalPaginas}
            onClick={() => setPage && setPage((p) => Math.min(totalPaginas, p + 1))}
            title="Página siguiente"
          >
            <FaAngleRight />
          </button>
          <button
            className={styles.pagBtn}
            disabled={page >= totalPaginas}
            onClick={() => setPage && setPage(totalPaginas)}
            title="Última página"
          >
            <FaAnglesRight />
          </button>

          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={(e) => setPageSize && setPageSize(Number(e.target.value))}
            title="Incidentes por página"
          >
            <option value={5}>5 / pág</option>
            <option value={10}>10 / pág</option>
            <option value={20}>20 / pág</option>
            <option value={50}>50 / pág</option>
          </select>
        </div>
      </div>

      {/* Modal de Expediente Forense Completo al seleccionar usuario/incidente */}
      {selectedIncidenteForense && (
        <ModalExpedienteForense
          incidente={selectedIncidenteForense}
          neutralizadosIds={neutralizadosIds}
          onClose={() => setSelectedIncidenteForense(null)}
          detalleBasePath={detalleBasePath}
        />
      )}
    </div>
  );
}
