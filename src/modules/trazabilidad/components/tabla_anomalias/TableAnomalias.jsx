import React, { useMemo, useState } from "react";
import SimpleTable from "./SimpleTable";
import { useDetalleAnomalias } from "../../../../api/apiAnomalias";
import { useSelector } from "react-redux";
import ModalTrazabilidad from "../modal_trazabilidad/ModalTrazabilidad";
import styles from "./TableAnomalias.module.css";
import {
  FaShieldHalved,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaFileLines,
  FaUserSecret,
  FaClock,
  FaArrowRight,
  FaFileCsv,
  FaRotateLeft,
  FaRoute,
  FaCircleCheck,
  FaLock,
  FaArrowUpRightFromSquare,
  FaMoon,
} from "react-icons/fa6";

// Helpers de clasificación institucional
function getBadgeClass(clasificacion) {
  const c = clasificacion?.toLowerCase() || "";
  if (c.includes("secreto")) return `${styles.badgeClasif} ${styles.clasifSecreto}`;
  if (c.includes("reservado")) return `${styles.badgeClasif} ${styles.clasifReservado}`;
  if (c.includes("confidencial")) return `${styles.badgeClasif} ${styles.clasifConfidencial}`;
  return `${styles.badgeClasif} ${styles.clasifComun}`;
}

function getClasifIcon(clasificacion) {
  const c = clasificacion?.toLowerCase() || "";
  if (c.includes("secreto")) return <FaLock style={{ fontSize: 9 }} />;
  if (c.includes("reservado")) return <FaShieldHalved style={{ fontSize: 9 }} />;
  if (c.includes("confidencial")) return <FaTriangleExclamation style={{ fontSize: 9 }} />;
  return <FaFileLines style={{ fontSize: 9 }} />;
}

// Helper de nivel de riesgo según los umbrales oficiales del modelo
function getNivelRiesgo(row) {
  if (row?.nivel_riesgo) {
    return String(row.nivel_riesgo).toLowerCase();
  }
  const score = Number(row?.score ?? row?.score_final ?? 0);
  if (score >= 0.75) return "critico";
  if (score >= 0.50) return "alto";
  if (score >= 0.25) return "medio";
  return "bajo";
}

// Formateador de fecha/hora legible
function formatFechaHora(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return { fecha: "-", hora: "-", esFueraHorario: false };
  try {
    const clean = dateStr.replace("T", " ");
    const [dPart, tPart] = clean.split(" ");
    let fFormatted = dPart;
    if (dPart && dPart.includes("-")) {
      const [y, m, d] = dPart.split("-");
      if (y?.length === 4) fFormatted = `${d}/${m}/${y}`;
    }
    const hFormatted = tPart ? tPart.substring(0, 5) : "";
    const horaNum = tPart ? parseInt(tPart.split(":")[0], 10) : 10;
    const esFueraHorario = horaNum < 8 || horaNum >= 16;
    return { fecha: fFormatted, hora: hFormatted, esFueraHorario };
  } catch {
    return { fecha: String(dateStr), hora: "", esFueraHorario: false };
  }
}

// Extractor de motivos limpios
function parseMotivos(rawMotivos) {
  if (!rawMotivos) return [];
  if (Array.isArray(rawMotivos)) {
    return rawMotivos
      .map((m) => (typeof m === "string" ? m : m?.descripcion || m?.codigo || ""))
      .filter(Boolean);
  }
  if (typeof rawMotivos === "string" && rawMotivos.trim()) {
    try {
      const parsed = JSON.parse(rawMotivos);
      if (Array.isArray(parsed)) {
        return parsed
          .map((m) => (typeof m === "string" ? m : m?.descripcion || m?.codigo || ""))
          .filter(Boolean);
      }
    } catch {
      return [rawMotivos];
    }
  }
  return [];
}

export default function TableAnomalias() {
  // Filtro global de fechas desde Redux
  const { fechaInicio, fechaFin } = useSelector((state) => state.FILTRO_FECHAS);

  // Estados locales de filtrado rápido interactivo
  const [filtroSeveridad, setFiltroSeveridad] = useState("todos"); // 'todos' | 'critico' | 'alto' | 'medio' | 'bajo' | 'exterior'
  const [filtroClasif, setFiltroClasif] = useState("todas"); // 'todas' | 'SECRETO' | ...

  // Estado para modal de trazabilidad { id, num }
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Consultar registros con límite alto para interactividad fluida en cliente
  const { data: result, isLoading: loading } = useDetalleAnomalias(1, 1000, {
    fechaInicio,
    fechaFin,
  });

  const rawData = useMemo(() => result?.data || [], [result?.data]);

  // Métricas calculadas para las KPI Cards de cabecera
  const kpis = useMemo(() => {
    let critico = 0;
    let alto = 0;
    let medio = 0;
    let bajo = 0;
    let exterior = 0;
    let clasificados = 0;

    rawData.forEach((row) => {
      // Solo el nivel derivado del score: una alerta directa ya no implica nivel crítico
      // (el pipeline dejó de forzar el score a 0.90).
      const n = getNivelRiesgo(row);
      if (n === "critico") critico++;
      else if (n === "alto") alto++;
      else if (n === "medio") medio++;
      else bajo++;

      if (String(row.destino || "").toLowerCase().includes("exterior")) exterior++;
      const clasif = String(row.clasificacion || "").toUpperCase();
      if (clasif.includes("SECRETO") || clasif.includes("RESERVADO")) clasificados++;
    });

    return {
      total: rawData.length,
      critico,
      alto,
      medio,
      bajo,
      exterior,
      clasificados,
    };
  }, [rawData]);

  // Filtrado reactivo en cliente según KPI Cards y Selects
  const datax = useMemo(() => {
    return rawData.filter((row) => {
      // 1. Filtro por severidad
      if (filtroSeveridad !== "todos") {
        if (filtroSeveridad === "exterior") {
          const esExt = String(row.destino || "").toLowerCase().includes("exterior");
          if (!esExt) return false;
        } else {
          if (getNivelRiesgo(row) !== filtroSeveridad) return false;
        }
      }

      // 2. Filtro por clasificación
      if (filtroClasif !== "todas") {
        const c = String(row.clasificacion || "").toUpperCase();
        if (!c.includes(filtroClasif)) return false;
      }

      return true;
    });
  }, [rawData, filtroSeveridad, filtroClasif]);

  // Exportar a CSV de los registros filtrados
  const handleExportCSV = (records) => {
    if (!records.length) return;
    const headers = [
      "ID_REGISTRO",
      "NUMERO_DOC",
      "TIPO_DOCUMENTO",
      "CLASIFICACION",
      "SCORE_FINAL",
      "NIVEL_RIESGO",
      "SCORE_REGLAS",
      "SCORE_IF",
      "OFICINA_ORIGEN",
      "OFICINA_DESTINO",
      "DESTINO",
      "USUARIO",
      "FECHA_CREACION",
      "ESTADO",
      "PESO_MB",
    ];

    const rows = records.map((item) => [
      item.id_registro || "",
      item.numero_doc || "",
      `"${item.tipo_documento || ""}"`,
      item.clasificacion || "",
      item.score != null ? Number(item.score).toFixed(6) : "",
      getNivelRiesgo(item),
      item.score_reglas != null ? Number(item.score_reglas).toFixed(6) : "",
      item.score_if != null ? Number(item.score_if).toFixed(6) : "",
      `"${item.oficina_origen || ""}"`,
      `"${item.oficina_destino || ""}"`,
      item.destino || "",
      `"${item.usuario || ""}"`,
      item.fecha_creacion || "",
      item.estado || "",
      item.peso_mb || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `auditoria_anomalias_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hayFiltrosActivos = filtroSeveridad !== "todos" || filtroClasif !== "todas";

  // Definición de las 8 Columnas Estratégicas
  const columns = useMemo(
    () => [
      // 1. Documento & Metadata
      {
        header: "Documento",
        accessorKey: "numero_doc",
        cell: (info) => {
          const numDoc = info.getValue();
          const idDoc = info.row.original.id_documento;
          const idReg = info.row.original.id_registro;
          const tipo = info.row.original.tipo_documento || "DOC";
          const peso = Number(info.row.original.peso_mb || 0);
          const esVoluminoso = peso > 15.0;

          return (
            <div
              className={styles.docCellPrimary}
              onClick={() => {
                if (idDoc) setSelectedDoc({ id: idDoc, num: numDoc });
              }}
              title={idDoc ? "Clic para ver trazabilidad completa del documento" : ""}
            >
              <div className={styles.docNumTitle}>
                <span>{numDoc ? `#${numDoc}` : `Reg #${idReg}`}</span>
                {idDoc && <FaArrowUpRightFromSquare style={{ fontSize: 10, color: "#94a3b8" }} />}
              </div>
              <div className={styles.docMetaSubline}>
                <span className={styles.docTipoBadge}>{tipo}</span>
                <span className={styles.docIdText}>ID: {idDoc || idReg}</span>
                {peso > 0 && (
                  <span className={esVoluminoso ? styles.docPesoHeavy : styles.docPesoNormal}>
                    {peso.toFixed(1)} MB
                  </span>
                )}
              </div>
            </div>
          );
        },
      },

      // 2. Clasificación de Seguridad
      {
        header: "Clasificación",
        accessorKey: "clasificacion",
        cell: (info) => {
          const clasif = info.getValue() || "COMUN";
          return (
            <span className={getBadgeClass(clasif)}>
              {getClasifIcon(clasif)}
              {clasif}
            </span>
          );
        },
      },

      // 3. Score & Nivel de Riesgo (Posición destacada en 3er lugar)
      {
        header: "Score & Riesgo",
        accessorKey: "score",
        cell: (info) => {
          const row = info.row.original;
          const score = Number(info.getValue() ?? row.score_final ?? 0);
          const scorePercent = Math.min(100, Math.max(0, score * 100));
          const nivel = getNivelRiesgo(row);

          const barClass =
            nivel === "critico"
              ? styles.barCritico
              : nivel === "alto"
              ? styles.barAlto
              : nivel === "medio"
              ? styles.barMedio
              : styles.barBajo;

          const badgeClass =
            nivel === "critico"
              ? styles.riesgoCritico
              : nivel === "alto"
              ? styles.riesgoAlto
              : nivel === "medio"
              ? styles.riesgoMedio
              : styles.riesgoBajo;

          const nivelLabel =
            nivel === "critico"
              ? "Crítico"
              : nivel === "alto"
              ? "Alto"
              : nivel === "medio"
              ? "Medio"
              : "Bajo";

          const scoreReglas = Number(row.score_reglas || 0);
          const scoreIf = Number(row.score_if || 0);
          const tooltipText = `Score Híbrido Final: ${score.toFixed(4)} (${scorePercent.toFixed(1)}%)\n• Reglas Heurísticas (60%): ${(scoreReglas * 100).toFixed(1)}%\n• Isolation Forest IA (40%): ${(scoreIf * 100).toFixed(1)}%${row.alerta_directa ? "\n🚨 Cortocircuito: Alerta Directa Activada" : ""}`;

          return (
            <div className={styles.scoreCellWrapper} title={tooltipText}>
              <div className={styles.scoreHeaderRow}>
                <span className={styles.scoreNumberVal}>
                  {score.toFixed(4)}
                  <span className={styles.scorePercentVal}> ({scorePercent.toFixed(1)}%)</span>
                </span>
                <span className={`${styles.badgeRiesgo} ${badgeClass}`}>
                  {row.alerta_directa ? "🚨 " : ""}
                  {nivelLabel}
                </span>
              </div>
              <div className={styles.scoreBarTrack}>
                <div
                  className={`${styles.scoreBarFill} ${barClass}`}
                  style={{ width: `${Math.max(6, scorePercent)}%` }}
                />
              </div>
              <div className={styles.scoreBreakdownRow}>
                <span>Reglas: {(scoreReglas * 100).toFixed(0)}%</span>
                <span>•</span>
                <span>IA: {(scoreIf * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        },
      },

      // 4. Motivos de Detección
      {
        header: "Motivos de Detección",
        id: "motivos_deteccion",
        accessorFn: (row) => parseMotivos(row.motivos).join(" "),
        cell: ({ row }) => {
          const rawMotivos = row.original.motivos;
          let motivosList = parseMotivos(rawMotivos);

          if (motivosList.length === 0) {
            if (row.original.alerta_directa) {
              motivosList = ["🚨 Alerta directa de seguridad en documento clasificado"];
            } else if (Number(row.original.score_if || 0) >= 0.70) {
              motivosList = ["⚡ Outlier multivariado identificado por Isolation Forest"];
            } else {
              motivosList = ["Desviación estadística en trazabilidad"];
            }
          }

          return (
            <div className={styles.motivosCell}>
              {motivosList.slice(0, 2).map((motivo, idx) => {
                const esAlerta =
                  motivo.includes("SECRETO") ||
                  motivo.includes("exterior") ||
                  motivo.includes("Alerta");
                return (
                  <span
                    key={idx}
                    className={`${styles.motivoChip} ${esAlerta ? styles.motivoChipAlert : ""}`}
                    title={motivo}
                  >
                    {motivo}
                  </span>
                );
              })}
              {motivosList.length > 2 && (
                <span
                  className={styles.motivoMore}
                  title={motivosList.slice(2).join("\n")}
                >
                  +{motivosList.length - 2} motivos más
                </span>
              )}
            </div>
          );
        },
      },

      // 5. Ruta del Trámite (Origen ➔ Destino)
      {
        header: "Ruta del Trámite",
        id: "ruta_tramite",
        accessorFn: (row) => `${row.oficina_origen || ""} ${row.oficina_destino || ""} ${row.destino || ""}`,
        cell: ({ row }) => {
          const orig = row.original.oficina_origen || "Origen desc.";
          const dest = row.original.oficina_destino || "Destino desc.";
          const esExterior = String(row.original.destino || "").toLowerCase().includes("exterior");

          return (
            <div className={styles.rutaContainer}>
              <div className={styles.rutaFlow}>
                <span className={styles.rutaOrigen} title={orig}>
                  {orig}
                </span>
                <FaArrowRight className={styles.rutaArrow} />
                <span className={styles.rutaDestino} title={dest}>
                  {dest}
                </span>
              </div>
              <div>
                {esExterior ? (
                  <span className={styles.badgeExterior}>
                    <FaTriangleExclamation style={{ fontSize: 9 }} />
                    Salida al Exterior
                  </span>
                ) : (
                  <span className={styles.badgeInterno}>Trámite Interno</span>
                )}
              </div>
            </div>
          );
        },
      },

      // 6. Usuario & Fecha
      {
        header: "Usuario & Hora",
        accessorKey: "usuario",
        cell: (info) => {
          const user = info.getValue() || "Sin asignar";
          const fc = info.row.original.fecha_creacion;
          const { fecha, hora, esFueraHorario } = formatFechaHora(fc);
          const iniciales = user.substring(0, 2).toUpperCase();

          return (
            <div className={styles.userContainer}>
              <div className={styles.userRow}>
                <div className={styles.userAvatar}>{iniciales}</div>
                <span title={user}>{user}</span>
              </div>
              <div className={styles.userTimeRow}>
                <FaClock style={{ fontSize: 10, color: "#94a3b8" }} />
                <span>{fecha} {hora}</span>
                {esFueraHorario && (
                  <span className={styles.badgeFueraHorario} title="Operación efectuada fuera de la jornada 08:00–16:00">
                    <FaMoon style={{ fontSize: 8 }} />
                    Ext.
                  </span>
                )}
              </div>
            </div>
          );
        },
      },

      // 7. Estado
      {
        header: "Estado",
        accessorKey: "estado",
        cell: (info) => {
          const val = info.getValue() || "Pendiente";
          return <span className={styles.estadoBadge}>{val}</span>;
        },
      },

      // 8. Trazabilidad
      {
        header: "Acción",
        id: "ver_trazabilidad",
        cell: ({ row }) => {
          const idDoc = row.original.id_documento;
          const numDoc = row.original.numero_doc;
          return (
            <button
              type="button"
              className={styles.btnTrazabilidad}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDoc({ id: idDoc, num: numDoc });
              }}
              disabled={!idDoc}
              title={
                idDoc
                  ? `Ver mapa secuencial del documento #${numDoc || idDoc}`
                  : "Sin ID de documento"
              }
            >
              <FaRoute className={styles.btnIcon} />
              <span className={styles.btnText}>Ver Flujo</span>
            </button>
          );
        },
      },
    ],
    [],
  );

  // Ficha Forense Expandida (SubComponent de detalle profundo)
  const renderForensicDetail = (row, onClose, rowNum) => {
    const score = Number(row.score ?? row.score_final ?? 0);
    const scoreReglas = Number(row.score_reglas || 0);
    const scoreIf = Number(row.score_if || 0);
    const nivel = getNivelRiesgo(row);
    const motivosList = parseMotivos(row.motivos);
    const { fecha, hora, esFueraHorario } = formatFechaHora(row.fecha_creacion);

    return (
      <div className={styles.forensicCard}>
        {/* Cabecera de la ficha */}
        <div className={styles.forensicHeader}>
          <div className={styles.forensicTitleArea}>
            <FaShieldHalved style={{ color: "#8b1a2b", fontSize: 18 }} />
            <h4 className={styles.forensicTitle}>
              Ficha de Análisis Forense — Registro #{row.id_registro || rowNum} (Doc #{row.numero_doc || "S/N"})
            </h4>
          </div>
          <div className={styles.forensicBadgeGroup}>
            <span
              className={`${styles.badgeRiesgo} ${
                nivel === "critico"
                  ? styles.riesgoCritico
                  : nivel === "alto"
                  ? styles.riesgoAlto
                  : styles.riesgoMedio
              }`}
            >
              {row.alerta_directa ? "🚨 Alerta Directa — " : ""}
              Riesgo {nivel.toUpperCase()}
            </span>
            <span className={getBadgeClass(row.clasificacion)}>
              {row.clasificacion || "COMUN"}
            </span>
            <button type="button" className={styles.btnResetFilters} onClick={onClose}>
              Cerrar detalle
            </button>
          </div>
        </div>

        {/* 3 Columnas de Análisis */}
        <div className={styles.forensicGrid}>
          {/* Caja 1: XAI Explicabilidad de IA */}
          <div className={styles.forensicBox}>
            <div className={styles.forensicBoxTitle}>
              <FaCircleCheck style={{ color: "#3b82f6" }} />
              Ensamble de Inferencia IA
            </div>
            <div className={styles.xaiMetricList}>
              <div className={styles.xaiMetric}>
                <span className={styles.xaiMetricLabel}>Score Híbrido Final:</span>
                <span className={styles.xaiMetricVal}>
                  {score.toFixed(4)} ({(score * 100).toFixed(1)}%)
                </span>
              </div>
              <div className={styles.xaiMetric}>
                <span className={styles.xaiMetricLabel}>Reglas Heurísticas (60%):</span>
                <span className={styles.xaiMetricVal}>{(scoreReglas * 100).toFixed(1)}%</span>
              </div>
              <div className={styles.xaiMetric}>
                <span className={styles.xaiMetricLabel}>Isolation Forest (40%):</span>
                <span className={styles.xaiMetricVal}>{(scoreIf * 100).toFixed(1)}%</span>
              </div>
              <div className={styles.xaiMetric}>
                <span className={styles.xaiMetricLabel}>Cortocircuito Directo:</span>
                <span className={styles.xaiMetricVal}>
                  {row.alerta_directa ? "🚨 ACTIVADO" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          {/* Caja 2: Evidencia y Motivos */}
          <div className={styles.forensicBox}>
            <div className={styles.forensicBoxTitle}>
              <FaTriangleExclamation style={{ color: "#f97316" }} />
              Factores de Riesgo Identificados
            </div>
            <div className={styles.motivosFullList}>
              {motivosList.length > 0 ? (
                motivosList.map((m, idx) => (
                  <div key={idx} className={styles.motivoItem}>
                    <span>•</span>
                    <span>{m}</span>
                  </div>
                ))
              ) : (
                <div className={styles.motivoItem}>
                  <span>•</span>
                  <span>
                    Patrón atípico multivariable en la secuencia temporal de despachos.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Caja 3: Datos del Trámite */}
          <div className={styles.forensicBox}>
            <div className={styles.forensicBoxTitle}>
              <FaFileLines style={{ color: "#64748b" }} />
              Parámetros de Auditoría
            </div>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Oficina Origen</span>
                <span className={styles.metaValue}>{row.oficina_origen || "-"}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Oficina Destino</span>
                <span className={styles.metaValue}>{row.oficina_destino || "-"}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Operador Responsable</span>
                <span className={styles.metaValue}>{row.usuario || "-"}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Momento del Evento</span>
                <span className={styles.metaValue}>
                  {fecha} {hora} {esFueraHorario ? "(Nocturno)" : ""}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Peso del Archivo</span>
                <span className={styles.metaValue}>{row.peso_mb ? `${row.peso_mb} MB` : "-"}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Estado del Trámite</span>
                <span className={styles.metaValue}>{row.estado || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer de acción */}
        <div className={styles.forensicFooter}>
          {row.id_documento && (
            <button
              type="button"
              className={styles.btnForensicAction}
              onClick={() => setSelectedDoc({ id: row.id_documento, num: row.numero_doc })}
            >
              <FaRoute />
              Explorar Árbol de Trazabilidad Completo
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderToolbar = ({ filteredData, hasLocalFilters, resetLocalFilters }) => (
    <div className={styles.toolbarContainer}>
      <div className={styles.tableHeading}>
        <h2 className={styles.sectionTitle}>Registros de auditoría</h2>
        <p className={styles.sectionHint}>
          {filteredData.length} de {kpis.total} registros · Abre el detalle con el botón +
        </p>
      </div>
      <div className={styles.toolbarActionsRight}>
        <label className={styles.classificationField}>
          <span className={styles.controlLabel}>Clasificación</span>
          <select
            className={styles.selectFilter}
            value={filtroClasif}
            onChange={(e) => setFiltroClasif(e.target.value)}
          >
            <option value="todas">Todas las clasificaciones</option>
            <option value="SECRETO">Secreto</option>
            <option value="RESERVADO">Reservado</option>
            <option value="CONFIDENCIAL">Confidencial</option>
            <option value="COMUN">Común</option>
          </select>
        </label>
        {(hayFiltrosActivos || hasLocalFilters) && (
          <button
            type="button"
            className={styles.btnResetFilters}
            onClick={() => {
              setFiltroSeveridad("todos");
              setFiltroClasif("todas");
              resetLocalFilters();
            }}
          >
            <FaRotateLeft aria-hidden="true" />
            Limpiar filtros
          </button>
        )}
        <button
          type="button"
          className={styles.btnExportar}
          onClick={() => handleExportCSV(filteredData)}
          disabled={filteredData.length === 0}
          title="Exportar los resultados de los filtros y la búsqueda"
        >
          <FaFileCsv aria-hidden="true" />
          Exportar CSV
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.statusCard} role="status">
        <FaShieldHalved className={styles.statusIcon} aria-hidden="true" />
        <p>Cargando auditoría de anomalías con el pipeline IA...</p>
      </div>
    );
  }

  if (rawData.length === 0) {
    return (
      <div className={styles.statusCard}>
        <FaShieldHalved className={styles.statusIcon} aria-hidden="true" />
        <h3>No hay anomalías registradas</h3>
        <p>
          No se encontraron anomalías en el rango de fechas seleccionado. Puedes subir un nuevo
          archivo CSV desde el menú lateral para ejecutar el análisis predictivo.
        </p>
      </div>
    );
  }

  return (
    <div>
      <section className={styles.summarySection} aria-labelledby="audit-summary-title">
        <div className={styles.summaryHeading}>
          <h2 id="audit-summary-title" className={styles.sectionTitle}>Resumen de anomalías</h2>
          <p className={styles.sectionHint}>Selecciona un indicador para filtrar los registros.</p>
        </div>
        <div className={styles.kpiGrid}>
          {[
            { key: "todos", title: "Total de anomalías", count: kpis.total, Icon: FaShieldHalved,
              cardClass: styles.kpiCardTotal,
              // La tabla carga como máximo 1000 registros (los de mayor score)
              description: (result?.total ?? 0) > kpis.total
                ? `Mostrando las ${kpis.total} de mayor score de ${result.total}`
                : "Todos los registros del período" },
            { key: "critico", title: "Críticas", count: kpis.critico, Icon: FaTriangleExclamation,
              cardClass: styles.kpiCardCritico, description: "Requieren atención inmediata" },
            { key: "alto", title: "Riesgo alto", count: kpis.alto, Icon: FaCircleExclamation,
              cardClass: styles.kpiCardAlto, description: "Desvíos significativos" },
            { key: "medio", title: "Riesgo medio", count: kpis.medio, Icon: FaCircleCheck,
              cardClass: styles.kpiCardMedio, description: "Requieren revisión" },
            { key: "bajo", title: "Riesgo bajo", count: kpis.bajo, Icon: FaCircleCheck,
              cardClass: styles.kpiCardBajo, description: "Anómalas por alerta directa o IF, score < 0.25" },
            { key: "exterior", title: "Salidas al exterior", count: kpis.exterior, Icon: FaRoute,
              cardClass: styles.kpiCardExterior, description: "Documentos enviados al exterior" },
          ].map(({ key, title, count, Icon, cardClass, description }) => (
            <button
              key={key}
              type="button"
              className={[styles.kpiCard, cardClass, filtroSeveridad === key ? styles.kpiCardActive : ""].join(" ")}
              aria-pressed={filtroSeveridad === key}
              onClick={() => setFiltroSeveridad(filtroSeveridad === key ? "todos" : key)}
            >
              <span className={styles.kpiTopRow}>
                <span className={styles.kpiTitle}>{title}</span>
                <Icon className={styles.kpiIcon} aria-hidden="true" />
              </span>
              <span className={styles.kpiValueRow}>
                <span className={styles.kpiNumber}>{count}</span>
                <span className={styles.kpiShare}>
                  {kpis.total ? ((count / kpis.total) * 100).toFixed(0) : 0}% del total
                </span>
              </span>
              <span className={styles.kpiSub}>{description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== TABLA PRINCIPAL CON TOOLBAR Y DETALLE FORENSE ===== */}
      <SimpleTable
        datax={datax}
        columns={columns}
        toolbarSlot={renderToolbar}
        renderExpanded={renderForensicDetail}
      />

      {/* Modal interactivo de trazabilidad documental */}
      {selectedDoc && (
        <ModalTrazabilidad
          idDocumento={selectedDoc.id}
          numeroDoc={selectedDoc.num}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}
