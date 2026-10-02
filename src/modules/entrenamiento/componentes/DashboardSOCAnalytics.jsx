import { useState, useMemo } from "react";
import styles from "./DashboardSOCAnalytics.module.css";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import {
  FaChartPie,
  FaFileArrowDown,
  FaUserSecret,
  FaFileLines,
  FaShieldHalved,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa6";
import { toast } from "sonner";

// Colores normativos de seguridad
const COLOR_CLASIFICACION = {
  SECRETO: "#b91c1c",
  RESERVADO: "#ea580c",
  CONFIDENCIAL: "#d97706",
  COMUN: "#64748b",
  NO_DEFINIDO: "#94a3b8",
};

const COLOR_ESTADO = {
  abierto: "#dc2626",
  en_investigacion: "#2563eb",
  contenido: "#7c3aed",
  mitigado: "#16a34a",
  falso_positivo: "#64748b",
};

const NOMBRES_ESTADO = {
  abierto: "Abierto",
  en_investigacion: "En Investigación",
  contenido: "Contenido",
  mitigado: "Mitigado",
  falso_positivo: "Falso Positivo",
};

export default function DashboardSOCAnalytics({ resumen, filtros = {}, setFiltros, setPage, incidentesList = [] }) {
  const [colapsado, setColapsado] = useState(false);

  const {
    total_incidentes = 0,
    total_eventos_analizados = 0,
    por_estado = {},
    tasa_contencion_porcentaje = 0,
    top_documentos = [],
    top_usuarios = [],
    por_clasificacion = {},
    evolucion_mensual = [],
  } = resumen || {};

  // 1. Datos para gráfico Donut de Clasificación
  const clasifData = useMemo(() => {
    if (!por_clasificacion) return [];
    return Object.entries(por_clasificacion).map(([key, val]) => ({
      name: key,
      value: val,
      color: COLOR_CLASIFICACION[key] || "#64748b",
    }));
  }, [por_clasificacion]);

  // 2. Datos para gráfico de Estado de Gestión
  const estadoData = useMemo(() => {
    if (!por_estado) return [];
    return Object.entries(por_estado)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => ({
        key,
        name: NOMBRES_ESTADO[key] || key,
        cantidad: val,
        color: COLOR_ESTADO[key] || "#64748b",
      }));
  }, [por_estado]);

  // 3. Usuarios ordenados por mayor score primero (y luego por cantidad de incidentes)
  const usuariosOrdenados = useMemo(() => {
    return [...(top_usuarios || [])].sort((a, b) => {
      const scoreDiff = Number(b.max_score || 0) - Number(a.max_score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return Number(b.incidentes || 0) - Number(a.incidentes || 0);
    });
  }, [top_usuarios]);

  // 4. Documentos ordenados por mayor score primero (y luego por cantidad de incidentes)
  const documentosOrdenados = useMemo(() => {
    return [...(top_documentos || [])].sort((a, b) => {
      const scoreDiff = Number(b.max_score || 0) - Number(a.max_score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return Number(b.incidentes || 0) - Number(a.incidentes || 0);
    });
  }, [top_documentos]);

  if (!resumen) return null;

  // Manejador de Cross-Filtering por Clasificación
  const handleClasificacionClick = (clasif) => {
    if (filtros.clasificacion === clasif) {
      setFiltros((prev) => ({ ...prev, clasificacion: "" }));
      toast.info("Filtro de clasificación removido");
    } else {
      setFiltros((prev) => ({ ...prev, clasificacion: clasif }));
      setPage(1);
      toast.success(`Filtrando por clasificación: ${clasif}`);
    }
  };

  // Manejador de Cross-Filtering por Estado
  const handleEstadoClick = (estadoKey) => {
    if (filtros.estado === estadoKey) {
      setFiltros((prev) => ({ ...prev, estado: "" }));
      toast.info("Filtro de estado removido");
    } else {
      setFiltros((prev) => ({ ...prev, estado: estadoKey }));
      setPage(1);
      toast.success(`Filtrando por estado: ${NOMBRES_ESTADO[estadoKey] || estadoKey}`);
    }
  };

  // Manejador de Cross-Filtering por Usuario
  const handleUsuarioClick = (nombreUsuario) => {
    if (filtros.busqueda === nombreUsuario) {
      setFiltros((prev) => ({ ...prev, busqueda: "" }));
      toast.info("Filtro de usuario removido");
    } else {
      setFiltros((prev) => ({ ...prev, busqueda: nombreUsuario }));
      setPage(1);
      toast.success(`Filtrando expedientes de: ${nombreUsuario}`);
    }
  };

  // Manejador de Cross-Filtering por Documento
  const handleDocumentoClick = (doc) => {
    const query = doc.numero_documento || String(doc.id_documento);
    if (filtros.busqueda === query) {
      setFiltros((prev) => ({ ...prev, busqueda: "" }));
      toast.info("Filtro de documento removido");
    } else {
      setFiltros((prev) => ({ ...prev, busqueda: query }));
      setPage(1);
      toast.success(`Filtrando documento: ${query}`);
    }
  };

  // Exportar Auditoría en CSV
  const handleExportCSV = () => {
    try {
      const items = incidentesList;
      if (!items || items.length === 0) {
        toast.error("No hay incidentes cargados para exportar.");
        return;
      }

      const headers = [
        "ID_Incidente",
        "Fecha_Deteccion",
        "ID_Documento",
        "Numero_Documento",
        "Clasificacion",
        "Destino",
        "ID_Usuario",
        "Nombre_Usuario",
        "Rol",
        "Score_Trazabilidad",
        "Score_Eventos_UEBA",
        "Score_Correlacion",
        "Nivel_Riesgo",
        "Estado_Gestion",
        "Accion_Tomada",
      ];

      const csvRows = [headers.join(",")];

      items.forEach((inc) => {
        const row = [
          inc.id,
          `"${inc.fecha_deteccion || ""}"`,
          inc.id_documento,
          `"${inc.numero_documento || ""}"`,
          `"${inc.clasificacion_doc || "COMUN"}"`,
          `"${inc.destino_doc || "INTERNO"}"`,
          inc.id_user,
          `"${inc.nombre_usuario || "Desconocido"}"`,
          `"${inc.name_role || "USER"}"`,
          Number(inc.score_trazabilidad ?? 0).toFixed(4),
          Number(inc.score_eventos ?? 0).toFixed(4),
          Number(inc.score_correlacion ?? 0).toFixed(4),
          `"${inc.nivel_riesgo || "bajo"}"`,
          `"${inc.estado || "abierto"}"`,
          `"${(inc.accion_tomada || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `auditoria_soc_incidentes_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Reporte de auditoría SOC exportado exitosamente.");
    } catch (err) {
      toast.error("Error exportando reporte CSV: " + err.message);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Barra de cabecera del panel analítico */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>PANEL DE INTELIGENCIA Y ANALÍTICA SOC</span>
          </div>
          <span className={styles.statSummary}>
            {total_eventos_analizados > 0 && (
              <>
                <strong>{total_eventos_analizados.toLocaleString()}</strong> eventos analizados |{" "}
              </>
            )}
            {total_incidentes.toLocaleString()} amenazas correlacionadas | Tasa de Contención:{" "}
            <strong>{tasa_contencion_porcentaje}%</strong>
          </span>
        </div>

        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.btnAction}
            onClick={handleExportCSV}
            title="Descargar registro forense en CSV"
          >
            <FaFileArrowDown /> Exportar Auditoría CSV
          </button>

          <button
            type="button"
            className={styles.btnToggle}
            onClick={() => setColapsado(!colapsado)}
            title={colapsado ? "Expandir gráficos" : "Contraer gráficos"}
          >
            {colapsado ? (
              <>
                <FaChevronDown /> Mostrar Gráficos
              </>
            ) : (
              <>
                <FaChevronUp /> Contraer Gráficos
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenido colapsable de gráficos (Grid 2x2 claro y balanceado) */}
      {!colapsado && (
        <div className={styles.analyticsGrid}>
          {/* ============================================================ */}
          {/* 1. DONUT: CLASIFICACIÓN DE DOCUMENTOS EN RIESGO */}
          {/* ============================================================ */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <FaChartPie style={{ color: "#b91c1c" }} />
                  Distribución de Incidentes por Clasificación
                </h3>
                <p className={styles.cardSubtitle}>
                  Volumen de amenazas detectadas según el nivel de secreto o confidencialidad. Haz clic en un sector para filtrar.
                </p>
              </div>
              {filtros.clasificacion && (
                <span className={styles.activeFilterBadge}>
                  Filtro: {filtros.clasificacion}
                  <button
                    type="button"
                    onClick={() => handleClasificacionClick(filtros.clasificacion)}
                    title="Quitar filtro"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className={styles.donutWrapper}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={clasifData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) => handleClasificacionClick(entry.name)}
                    cursor="pointer"
                  >
                    {clasifData.map((entry, index) => (
                      <Cell
                        key={`clasif-${index}`}
                        fill={entry.color}
                        stroke={filtros.clasificacion === entry.name ? "#111827" : "#ffffff"}
                        strokeWidth={filtros.clasificacion === entry.name ? 3 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [
                      `${val.toLocaleString()} incidentes (${((val / Math.max(total_incidentes, 1)) * 100).toFixed(
                        1,
                      )}%)`,
                      `Clasificación: ${name}`,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(val) => (
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: filtros.clasificacion === val ? 700 : 500,
                          color: filtros.clasificacion === val ? "#111827" : "#475569",
                        }}
                      >
                        {val} ({por_clasificacion[val] || 0})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 2. BARRAS: ESTADO DE GESTIÓN Y CONTENCIÓN SOC */}
          {/* ============================================================ */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <FaShieldHalved style={{ color: "#2563eb" }} />
                  Estado de Contención del SOC (Lifecycle)
                </h3>
                <p className={styles.cardSubtitle}>
                  Triage de incidentes. Haz clic en una barra para filtrar según el estado operativo.
                </p>
              </div>
              {filtros.estado && (
                <span className={styles.activeFilterBadge}>
                  Filtro: {NOMBRES_ESTADO[filtros.estado] || filtros.estado}
                  <button type="button" onClick={() => handleEstadoClick(filtros.estado)}>
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className={styles.chartBarWrapper}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={estadoData} margin={{ top: 15, right: 15, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: "#475569" }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val, name, item) => [`${val.toLocaleString()} expedientes`, item.payload.name]}
                  />
                  <Bar
                    dataKey="cantidad"
                    radius={[6, 6, 0, 0]}
                    onClick={(entry) => handleEstadoClick(entry.key)}
                    cursor="pointer"
                  >
                    {estadoData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={entry.color}
                        stroke={filtros.estado === entry.key ? "#111827" : "none"}
                        strokeWidth={filtros.estado === entry.key ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 3. TOP 10 USUARIOS CON MAYOR VOLUMEN DE INCIDENTES */}
          {/* ============================================================ */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <FaUserSecret style={{ color: "#7c3aed" }} />
                  Top 10 Usuarios con Mayor Compromiso
                </h3>
                <p className={styles.cardSubtitle}>
                  Actores recurrentes en saltos o eventos anómalos.
                </p>
              </div>
              
              <div className={styles.controlsGroup}>
                <select
                  className={styles.monthSelect}
                  value={filtros.mes || ""}
                  onChange={(e) => {
                    setFiltros((prev) => ({ ...prev, mes: e.target.value }));
                    setPage(1);
                  }}
                  title="Filtrar incidentes por mes"
                >
                  <option value="">Todos los meses</option>
                  {evolucion_mensual
                    ?.filter((m) => m.total > 0)
                    .map((m) => (
                      <option key={`usr-${m.key}`} value={m.key}>
                        {m.mes_completo}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className={styles.rankingList}>
              {usuariosOrdenados && usuariosOrdenados.length > 0 ? (
                usuariosOrdenados.map((u, i) => {
                  const isFiltered = filtros.busqueda === u.nombre_usuario;
                  const maxScorePct = Math.round(Number(u.max_score || 0) * 100);
                  const colorBadge =
                    maxScorePct >= 75 ? "#dc2626" : maxScorePct >= 50 ? "#ea580c" : "#eab308";
                  const rankClass =
                    i === 0
                      ? styles.rankBadgeTop1
                      : i === 1
                      ? styles.rankBadgeTop2
                      : i === 2
                      ? styles.rankBadgeTop3
                      : "";

                  return (
                    <div
                      key={u.id_user || i}
                      className={`${styles.rankingItem} ${styles.rankingItemUser} ${
                        isFiltered ? styles.rankingItemActive : ""
                      }`}
                      onClick={() => handleUsuarioClick(u.nombre_usuario)}
                      title={`Clic para filtrar incidentes de ${u.nombre_usuario}`}
                    >
                      {/* 1. Medalla / Posición */}
                      <div className={`${styles.rankBadge} ${rankClass}`}>#{i + 1}</div>

                      {/* 2. Nombre del Usuario */}
                      <div className={styles.rankPrimaryCol}>
                        <span className={styles.rankName} title={u.nombre_usuario}>
                          {u.nombre_usuario}
                        </span>
                      </div>

                      {/* 3. DNI / ID del Usuario */}
                      <span className={styles.rankIdPill}>ID_USER: {u.id_user}</span>

                      {/* 4. Conteo de incidentes */}
                      <div className={styles.rankMetaPill}>
                        <strong>{u.incidentes}</strong> incidentes
                      </div>

                      {/* 5. Score de Severidad y Mini Barra Visual */}
                      <div className={styles.scoreContainer}>
                        <span
                          className={styles.scorePill}
                          style={{
                            backgroundColor: `${colorBadge}12`,
                            color: colorBadge,
                            borderColor: `${colorBadge}35`,
                          }}
                        >
                          Score: {maxScorePct}%
                        </span>
                        <div className={styles.scoreBarTrack}>
                          <div
                            className={styles.scoreBarFill}
                            style={{ width: `${maxScorePct}%`, backgroundColor: colorBadge }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={styles.emptyText}>No hay datos suficientes de usuarios.</p>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* 4. TOP 10 DOCUMENTOS MÁS VULNERADOS */}
          {/* ============================================================ */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>
                  <FaFileLines style={{ color: "#0284c7" }} />
                  Top 10 Documentos Críticos Comprometidos
                </h3>
                <p className={styles.cardSubtitle}>
                  Activos de información más atacados ordenados por severidad de riesgo.
                </p>
              </div>

              <div className={styles.controlsGroup}>
                <select
                  className={styles.monthSelect}
                  value={filtros.mes || ""}
                  onChange={(e) => {
                    setFiltros((prev) => ({ ...prev, mes: e.target.value }));
                    setPage(1);
                  }}
                  title="Filtrar incidentes por mes"
                >
                  <option value="">Todos los meses</option>
                  {evolucion_mensual
                    ?.filter((m) => m.total > 0)
                    .map((m) => (
                      <option key={`doc-${m.key}`} value={m.key}>
                        {m.mes_completo}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className={styles.rankingList}>
              {documentosOrdenados && documentosOrdenados.length > 0 ? (
                documentosOrdenados.map((d, i) => {
                  const isFiltered =
                    filtros.busqueda === d.numero_documento || filtros.busqueda === String(d.id_documento);
                  const clasifColor = COLOR_CLASIFICACION[d.clasificacion_doc] || COLOR_CLASIFICACION.COMUN;
                  const maxScorePct = Math.round(Number(d.max_score || 0) * 100);
                  const colorBadge =
                    maxScorePct >= 75 ? "#dc2626" : maxScorePct >= 50 ? "#ea580c" : "#eab308";
                  const rankClass =
                    i === 0
                      ? styles.rankBadgeTop1
                      : i === 1
                      ? styles.rankBadgeTop2
                      : i === 2
                      ? styles.rankBadgeTop3
                      : "";

                  return (
                    <div
                      key={d.id_documento || i}
                      className={`${styles.rankingItem} ${styles.rankingItemDoc} ${
                        isFiltered ? styles.rankingItemActive : ""
                      }`}
                      onClick={() => handleDocumentoClick(d)}
                      title={`Clic para filtrar incidentes del documento ${d.numero_documento || d.id_documento}`}
                    >
                      {/* 1. Medalla / Posición */}
                      <div className={`${styles.rankBadge} ${rankClass}`}>#{i + 1}</div>

                      {/* 2. Identidad del Documento */}
                      <div className={styles.rankPrimaryCol}>
                        <span className={styles.rankName} title={`Doc. Nº ${d.numero_documento || d.id_documento}`}>
                          Doc. {d.numero_documento ? `Nº ${d.numero_documento}` : `#${d.id_documento}`}
                        </span>
                      </div>

                      {/* 3. ID Activo */}
                      <span className={styles.rankIdPill}>ID_DOC: {d.id_documento}</span>

                      {/* 4. Clasificación de Seguridad */}
                      <span
                        className={styles.clasifBadgeSmall}
                        style={{
                          backgroundColor: `${clasifColor}14`,
                          color: clasifColor,
                          borderColor: `${clasifColor}40`,
                        }}
                      >
                        {d.clasificacion_doc || "COMUN"}
                      </span>

                      {/* 5. Conteo de Eventos */}
                      <div className={styles.rankMetaPill}>
                        <strong>{d.incidentes}</strong> {d.incidentes === 1 ? "evento" : "eventos"}
                      </div>

                      {/* 6. Score de Severidad y Mini Barra Visual */}
                      <div className={styles.scoreContainer}>
                        <span
                          className={styles.scorePill}
                          style={{
                            backgroundColor: `${colorBadge}12`,
                            color: colorBadge,
                            borderColor: `${colorBadge}35`,
                          }}
                        >
                          Score: {maxScorePct}%
                        </span>
                        <div className={styles.scoreBarTrack}>
                          <div
                            className={styles.scoreBarFill}
                            style={{ width: `${maxScorePct}%`, backgroundColor: colorBadge }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={styles.emptyText}>No hay datos suficientes de documentos.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
