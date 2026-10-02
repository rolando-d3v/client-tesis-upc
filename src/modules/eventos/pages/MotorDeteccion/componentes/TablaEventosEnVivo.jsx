import React, { Fragment, useMemo, useState } from "react";
import styles from "./TablaEventosEnVivo.module.css";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  FaMagnifyingGlass,
  FaXmark,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaCircleInfo,
  FaArrowUp,
  FaArrowDown,
  FaSort,
  FaRotateLeft,
  FaTriangleExclamation,
  FaBan,
} from "react-icons/fa6";
import RoleBadge from "../../../../../components/RoleBadge";

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

export default function TablaEventosEnVivo({
  eventos = [],
  filtros = {},
  setFiltros,
  onSeleccionarEvento,
  onNeutralizarUsuario,
  neutralizadosIds = [],
  autoScroll = true,
  setAutoScroll,
}) {
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
  };

  const handleClearSearch = () => {
    setFiltros((prev) => ({ ...prev, busqueda: "" }));
  };

  const handleFilterChange = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFiltros({
      busqueda: "",
      nivel_riesgo: "",
      clasificacion: "",
      tipo_evento: "",
      rol: "",
    });
  };

  const hasActiveFilters = Boolean(
    filtros.busqueda ||
      filtros.nivel_riesgo ||
      filtros.clasificacion ||
      filtros.tipo_evento ||
      filtros.rol
  );

  // Filtrado de eventos en memoria para el TanStack Table
  const filteredData = useMemo(() => {
    return eventos.filter((ev) => {
      // Filtro de búsqueda textual
      if (filtros.busqueda) {
        const q = filtros.busqueda.toLowerCase();
        const matchesUser = ev.name_user?.toLowerCase().includes(q);
        const matchesDoc = ev.numero_documento?.toLowerCase().includes(q);
        const matchesOficina = ev.name_oficina?.toLowerCase().includes(q);
        const matchesTipo = ev.name_tipo_evento?.toLowerCase().includes(q);
        const matchesId = String(ev.id_evento).includes(q);
        const matchesRole = (ev.name_role || ev.rol || ev.role)?.toLowerCase().includes(q);
        if (!matchesUser && !matchesDoc && !matchesOficina && !matchesTipo && !matchesId && !matchesRole) {
          return false;
        }
      }

      // Filtro nivel de riesgo
      if (filtros.nivel_riesgo) {
        if (filtros.nivel_riesgo === "anomalia") {
          if (!ev.es_anomalia) return false;
        } else if (filtros.nivel_riesgo === "fuera_horario") {
          const fuera = ev.motivos?.some((m) => m.codigo?.includes("HORARIO"));
          if (!fuera) return false;
        } else if (filtros.nivel_riesgo === "exterior") {
          if (ev.doc_interno_externo !== "exterior") return false;
        } else {
          if (ev.nivel_riesgo?.toLowerCase() !== filtros.nivel_riesgo.toLowerCase()) {
            return false;
          }
        }
      }

      // Filtro clasificación
      if (filtros.clasificacion) {
        if (ev.name_clasificacion?.toUpperCase() !== filtros.clasificacion.toUpperCase()) {
          return false;
        }
      }

      // Filtro tipo de evento
      if (filtros.tipo_evento) {
        if (ev.name_tipo_evento?.toUpperCase() !== filtros.tipo_evento.toUpperCase()) {
          return false;
        }
      }

      // Filtro rol institucional
      if (filtros.rol) {
        const evRol = (ev.name_role || ev.rol || ev.role || "USER").toUpperCase();
        if (evRol !== filtros.rol.toUpperCase()) {
          return false;
        }
      }

      return true;
    });
  }, [eventos, filtros]);

  // Definición de columnas con TanStack Table
  const columns = useMemo(
    () => [
      // {
      //   accessorKey: "id_evento",
      //   header: "ID",
      //   meta: { align: "center", width: "6%" },
      //   cell: (info) => (
      //     <span className={styles.idBadge}>#{info.getValue()}</span>
      //   ),
      // },
      {
        accessorKey: "fecha_evento",
        header: "Hora / Fecha",
        meta: { align: "left", width: "12%" },
        cell: (info) => {
          const val = info.getValue();
          if (!val) return <span style={{ color: "#9ca3af" }}>-</span>;
          const partes = String(val).split(" ");
          const fecha = partes[0] || "";
          const hora = partes[1] || "";
          return (
            <div className={styles.fechaCell}>
              <span className={styles.fechaMain}>{hora || fecha}</span>
              {hora && (
                <span className={styles.fechaTime}>
                  <FaClock style={{ fontSize: "0.68rem" }} />
                  {fecha}
                </span>
              )}
            </div>
          );
        },
      },
      // {
      //   id: "documento",
      //   accessorKey: "numero_documento",
      //   header: "Documento Afectado",
      //   meta: { align: "left", width: "22%" },
      //   cell: ({ row }) => {
      //     const ev = row.original;
      //     return (
      //       <div className={styles.docCell}>
      //         <span className={styles.docNum} title={ev.numero_documento}>
      //           {ev.numero_documento || "DOC-S/N"}
      //         </span>
      //         <div className={styles.docMetaRow}>
      //           <span
      //             className={`${styles.clasifBadge} ${getClasifClass(
      //               ev.name_clasificacion
      //             )}`}
      //           >
      //             {ev.name_clasificacion || "COMUN"}
      //           </span>
      //           <span
      //             className={`${styles.docDestino} ${
      //               ev.doc_interno_externo === "exterior"
      //                 ? styles.docDestinoExt
      //                 : ""
      //             }`}
      //           >
      //             {ev.doc_interno_externo === "exterior" ? "🌐 Ext" : "🏢 Int"}
      //           </span>
      //         </div>
      //       </div>
      //     );
      //   },
      // },
      {
        id: "usuario",
        accessorKey: "name_user",
        header: "Usuario & Oficina",
        meta: { align: "left", width: "20%" },
        cell: ({ row }) => {
          const ev = row.original;
          const initial = ev.name_user
            ? ev.name_user.charAt(0).toUpperCase()
            : "U";
          const isNeutralizado =
            neutralizadosIds.includes(String(ev.id_user)) ||
            neutralizadosIds.includes(ev.name_user);

          return (
            <div className={styles.userCell}>
              <div
                className={styles.userAvatar}
                style={isNeutralizado ? { borderColor: "#dc2626", background: "#fef2f2", color: "#dc2626" } : {}}
              >
                {initial}
              </div>
              <div className={styles.userInfo}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span className={styles.userName} title={ev.name_user}>
                    {ev.name_user || "Usuario Desconocido"}
                  </span>
                  {isNeutralizado && (
                    <span
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "1px solid #fecaca",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                      }}
                      title="Cuenta bloqueada preventivamente"
                    >
                      BLOQUEADO
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: 2, flexWrap: "wrap" }}>
                  <RoleBadge role={ev.name_role || ev.rol || ev.role} size="small" />
                  <span className={styles.userId}>
                    {ev.name_oficina || `ID: ${ev.id_user}`}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "accion",
        accessorKey: "name_tipo_evento",
        header: "Acción & Tamaño",
        meta: { align: "left", width: "13%" },
        cell: ({ row }) => {
          const ev = row.original;
          return (
            <div>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                {ev.name_tipo_evento || "EVENTO"}
              </span>
              <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                {ev.size_archivo_mb ?? 0} MB
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "score_final",
        header: "Nivel & Score",
        meta: { align: "left", width: "15%" },
        cell: ({ row }) => {
          const ev = row.original;
          const score = Number(ev.score_final || 0);
          const scorePercent = Math.min(100, Math.max(0, Math.round(score * 100)));
          const riesgo = (ev.nivel_riesgo || "bajo").toLowerCase();

          let barClass = styles.barBajo;
          if (riesgo === "critico") barClass = styles.barCritico;
          else if (riesgo === "alto") barClass = styles.barAlto;
          else if (riesgo === "medio") barClass = styles.barMedio;

          return (
            <div className={styles.scoreCell}>
              <div className={styles.scoreTopRow}>
                <span className={styles.scoreVal}>{scorePercent}%</span>
                <span
                  className={`${styles.badgeRiesgo} ${getRiesgoClass(
                    ev.nivel_riesgo
                  )}`}
                >
                  {ev.nivel_riesgo || "Bajo"}
                </span>
              </div>
              <div className={styles.scoreBarWrapper}>
                <div
                  className={`${styles.scoreBarFill} ${barClass}`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
            </div>
          );
        },
      },
      // {
      //   id: "motivos",
      //   header: "Alertas XAI",
      //   meta: { align: "left", width: "14%" },
      //   cell: ({ row }) => {
      //     const ev = row.original;
      //     if (!ev.motivos || ev.motivos.length === 0) {
      //       return (
      //         <span style={{ color: "#9ca3af", fontSize: "0.78rem" }}>
      //           Normal
      //         </span>
      //       );
      //     }
      //     return (
      //       <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
      //         {ev.motivos.slice(0, 2).map((m, idx) => (
      //           <span
      //             key={idx}
      //             title={m.descripcion}
      //             style={{
      //               fontSize: "0.72rem",
      //               fontWeight: 700,
      //               background: "#fee2e2",
      //               color: "#b91c1c",
      //               border: "1px solid #fecaca",
      //               padding: "0.15rem 0.4rem",
      //               borderRadius: "4px",
      //             }}
      //           >
      //             {m.codigo.replace("E_", "").replace("E1_", "").replace("E2_", "").replace("E3_", "")}
      //           </span>
      //         ))}
      //         {ev.motivos.length > 2 && (
      //           <span style={{ fontSize: "0.72rem", color: "#6b7280", fontWeight: 600 }}>
      //             +{ev.motivos.length - 2}
      //           </span>
      //         )}
      //       </div>
      //     );
      //   },
      // },
      {
        id: "acciones",
        header: "Acción",
        enableSorting: false,
        meta: { align: "right", width: "11%" },
        cell: ({ row }) => {
          const ev = row.original;
          const isExpanded = !!expandedRows[row.id];
          const isNeutralizado =
            neutralizadosIds.includes(String(ev.id_user)) ||
            neutralizadosIds.includes(ev.name_user);

          return (
            <div className={styles.actionsCell}>
              {onNeutralizarUsuario && (
                <button
                  type="button"
                  style={{
                    background: isNeutralizado ? "#fee2e2" : "#ffffff",
                    color: isNeutralizado ? "#dc2626" : "#ef4444",
                    border: "1.5px solid",
                    borderColor: isNeutralizado ? "#fca5a5" : "#fecaca",
                    borderRadius: "6px",
                    padding: "0.35rem 0.45rem",
                    cursor: isNeutralizado ? "default" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    transition: "all 0.15s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isNeutralizado) {
                      const confirm = window.confirm(
                        `¿Confirmas el bloqueo preventivo y neutralización de la cuenta de ${ev.name_user || "usuario"}?`
                      );
                      if (confirm) onNeutralizarUsuario(ev);
                    }
                  }}
                  title={
                    isNeutralizado
                      ? "Usuario ya neutralizado"
                      : `Neutralizar cuenta de ${ev.name_user || "usuario"}`
                  }
                  disabled={isNeutralizado}
                >
                  <FaBan />
                </button>
              )}
              <button
                type="button"
                className={`${styles.btnExpand} ${
                  isExpanded ? styles.btnExpandActive : ""
                }`}
                onClick={() => toggleRowExpand(row.id)}
                title={isExpanded ? "Ocultar detalles" : "Ver telemetría rápida"}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <button
                type="button"
                className={styles.btnDetalle}
                onClick={() => onSeleccionarEvento && onSeleccionarEvento(ev)}
                title="Inspección detallada JSON y Welford"
              >
                <FaCircleInfo />
              </button>
            </div>
          );
        },
      },
    ],
    [expandedRows, onSeleccionarEvento, onNeutralizarUsuario, neutralizadosIds]
  );

  // TanStack Table Instance (sin paginación, muestra todos los eventos en memoria)
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const renderSortIcon = (column) => {
    const isSorted = column.getIsSorted();
    if (isSorted === "asc") return <FaArrowUp className={styles.sortIcon} />;
    if (isSorted === "desc") return <FaArrowDown className={styles.sortIcon} />;
    if (column.getCanSort())
      return <FaSort className={styles.sortIconNeutral} />;
    return null;
  };

  return (
    <div className={styles.container}>
      {/* BARRA DE CONTROLES Y FILTROS */}
      <div className={styles.controlsBar}>

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
            <option value="anomalia">Solo Anomalías</option>
            <option value="fuera_horario">Fuera de Horario</option>
            <option value="exterior">Hacia Exterior</option>
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
          >
            <option value="">Todas las Acciones</option>
            <option value="DESCARGAR">DESCARGAR</option>
            <option value="VISTA">VISTA</option>
            <option value="EDITAR">EDITAR</option>
            <option value="ELIMINAR">ELIMINAR</option>
            <option value="GUARDAR_COPIA">GUARDAR_COPIA</option>
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

       
        </div>
      </div>

      {/* TABLA TANSTACK */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const align =
                    header.column.columnDef.meta?.align || "left";
                  const width = header.column.columnDef.meta?.width;

                  return (
                    <th
                      key={header.id}
                      className={`${styles.th} ${
                        canSort ? styles.thSortable : ""
                      }`}
                      style={{
                        width: width,
                        textAlign: align,
                      }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div
                        className={styles.thContent}
                        style={{
                          justifyContent:
                            align === "right"
                              ? "flex-end"
                              : align === "center"
                              ? "center"
                              : "flex-start",
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {canSort && renderSortIcon(header.column)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className={styles.tbody}>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: "center",
                    padding: "3rem 1rem",
                    color: "#9ca3af",
                  }}
                >
                  No se han registrado eventos o no coinciden con los filtros aplicados.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, index) => {
                const isExpanded = !!expandedRows[row.id];
                const ev = row.original;
                return (
                  <Fragment key={row.id}>
                    <tr className={index === 0 ? styles.rowNuevo : ""}>
                      {row.getVisibleCells().map((cell) => {
                        const align =
                          cell.column.columnDef.meta?.align || "left";
                        return (
                          <td
                            key={cell.id}
                            className={styles.td}
                            style={{ textAlign: align }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* EXPANDED TELEMETRY ROW */}
                    {isExpanded && (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className={styles.expandedRow}
                        >
                          <div className={styles.expandedGrid}>
                            <div className={styles.telemetryCard}>
                              <div className={styles.telemetryTitle}>
                                Modelos & Scores
                              </div>
                              <p className={styles.telemetryText}>
                                <strong>Isolation Forest:</strong> {ev.score_if ?? "N/A"}
                              </p>
                              <p className={styles.telemetryText}>
                                <strong>Motor de Reglas:</strong> {ev.score_reglas ?? "N/A"}
                              </p>
                              <p className={styles.telemetryText}>
                                <strong>Score de Riesgo:</strong> {ev.score_riesgo ?? 0} / 30
                              </p>
                            </div>

                            <div className={styles.telemetryCard}>
                              <div className={styles.telemetryTitle}>
                                Línea Base Dinámica (Welford + EWMA)
                              </div>
                              <p className={styles.telemetryText}>
                                <strong>Fuente:</strong>{" "}
                                {ev.perfil_actualizado?.fuente_linea_base || "Entrenamiento (164k filas)"}
                              </p>
                              <p className={styles.telemetryText}>
                                <strong>Media Histórica MB:</strong>{" "}
                                {ev.perfil_actualizado?.tamano_mean !== undefined
                                  ? ev.perfil_actualizado.tamano_mean.toFixed(2)
                                  : "N/A"} MB
                              </p>
                              <p className={styles.telemetryText}>
                                <strong>Historial Evaluado:</strong>{" "}
                                {ev.perfil_actualizado?.n_eventos || 1} eventos
                              </p>
                            </div>

                            <div className={styles.telemetryCard}>
                              <div className={styles.telemetryTitle}>
                                Motivos Explicables XAI
                              </div>
                              {ev.motivos && ev.motivos.length > 0 ? (
                                ev.motivos.map((m, mIdx) => (
                                  <p key={mIdx} className={styles.telemetryText}>
                                    <FaTriangleExclamation
                                      style={{ color: "#ef4444", marginRight: "0.25rem" }}
                                    />
                                    <strong>[{m.codigo}]:</strong> {m.descripcion}
                                  </p>
                                ))
                              ) : (
                                <p className={styles.telemetryText} style={{ color: "#16a34a" }}>
                                  ✓ Parámetros dentro de umbrales habituales
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
