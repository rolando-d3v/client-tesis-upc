import { useState, useMemo } from "react";
import styles from "./DashboardSOCAnalytics.module.css";
import GraficoTipoEvento from "./GraficoTipoEvento";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import {
  FaChartPie,
  FaChartLine,
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
const ORDEN_ESTADOS = Object.keys(NOMBRES_ESTADO);

const MESES_ABREV = ["en", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

export default function DashboardSOCAnalytics({
  resumen,
  filtros = {},
  setFiltros,
  setPage,
  incidentesList = [],
  tiempoReal = false,
}) {
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
    return Object.entries(por_clasificacion)
      .map(([key, val]) => ({
        key,
        name: key.replaceAll("_", " "),
        value: Number(val) || 0,
        color: COLOR_CLASIFICACION[key] || "#64748b",
      }))
      .filter((item) => item.value > 0);
  }, [por_clasificacion]);

  const totalClasificaciones = clasifData.reduce((total, item) => total + item.value, 0);

  // 2. Datos para gráfico de Estado de Gestión
  const estadoData = useMemo(() => {
    if (!por_estado) return [];
    return Object.entries(por_estado)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => ({
        key,
        name: NOMBRES_ESTADO[key] || key,
        cantidad: Number(val) || 0,
        color: COLOR_ESTADO[key] || "#64748b",
      }))
      .sort((a, b) => {
        const indexA = ORDEN_ESTADOS.indexOf(a.key);
        const indexB = ORDEN_ESTADOS.indexOf(b.key);
        return (indexA < 0 ? ORDEN_ESTADOS.length : indexA) - (indexB < 0 ? ORDEN_ESTADOS.length : indexB);
      });
  }, [por_estado]);

  const evolucionData = useMemo(
    () =>
      (evolucion_mensual || []).map((item) => {
        const key = String(item.key || item.mes || item.label || item.mes_completo || "");
        const monthMatch = key.match(/^\d{4}-(\d{1,2})$/);
        const monthIndex = monthMatch ? Number(monthMatch[1]) - 1 : -1;
        const sourceLabel = String(item.label || item.mes || item.mes_completo || key);
        const label = monthIndex >= 0 && monthIndex < MESES_ABREV.length
          ? MESES_ABREV[monthIndex]
          : sourceLabel.split(" ")[0];

        return {
          key,
          label,
          mesCompleto: item.mes_completo || item.label || item.mes || key,
          total: Number(item.total) || 0,
        };
      }),
    [evolucion_mensual]
  );

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
      setPage(1);
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
      setPage(1);
      toast.info("Filtro de estado removido");
    } else {
      setFiltros((prev) => ({ ...prev, estado: estadoKey }));
      setPage(1);
      toast.success(`Filtrando por estado: ${NOMBRES_ESTADO[estadoKey] || estadoKey}`);
    }
  };

  const handleMesClick = (month) => {
    if (!month?.key) return;

    if (filtros.mes === month.key) {
      setFiltros((prev) => ({ ...prev, mes: "" }));
      setPage(1);
      toast.info("Filtro mensual removido");
    } else {
      setFiltros((prev) => ({ ...prev, mes: month.key }));
      setPage(1);
      toast.success(`Filtrando incidentes de ${month.mesCompleto || month.key}`);
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

      {/* Contenido colapsable de gráficos */}
      {!colapsado && (
        <div className={styles.chartsContainer}>
          <div className={styles.topChartsRow}>
            <div className={`${styles.card} ${styles.topChartCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <FaChartPie style={{ color: "#b91c1c" }} />
                    Incidentes por clasificación
                  </h3>
                  <p className={styles.cardSubtitle}>Distribución por nivel de confidencialidad. Selecciona una categoría para filtrar.</p>
                </div>
                {filtros.clasificacion && (
                  <span className={styles.activeFilterBadge}>
                    {filtros.clasificacion.replaceAll("_", " ")}
                    <button
                      type="button"
                      onClick={() => handleClasificacionClick(filtros.clasificacion)}
                      title="Quitar filtro de clasificación"
                      aria-label="Quitar filtro de clasificación"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              {totalClasificaciones > 0 ? (
                <div className={styles.donutContent}>
                  <div className={styles.donutWrapper}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clasifData}
                          cx="50%"
                          cy="50%"
                          innerRadius="58%"
                          outerRadius="84%"
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          isAnimationActive={!tiempoReal}
                          onClick={(entry) => handleClasificacionClick(entry.key)}
                          cursor="pointer"
                        >
                          {clasifData.map((entry) => (
                            <Cell
                              key={`clasif-${entry.key}`}
                              fill={entry.color}
                              stroke={filtros.clasificacion === entry.key ? "#111827" : "#ffffff"}
                              strokeWidth={filtros.clasificacion === entry.key ? 3 : 1}
                              opacity={filtros.clasificacion && filtros.clasificacion !== entry.key ? 0.4 : 1}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value).toLocaleString()} (${((Number(value) / totalClasificaciones) * 100).toFixed(1)}%)`,
                            "Incidentes",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className={styles.donutCenter} aria-hidden="true">
                      <strong>{totalClasificaciones.toLocaleString()}</strong>
                      <span>incidentes</span>
                    </div>
                  </div>

                  <div className={styles.classificationLegend} role="group" aria-label="Filtrar por clasificación">
                    {clasifData.map((entry) => {
                      const isActive = filtros.clasificacion === entry.key;
                      const percentage = ((entry.value / totalClasificaciones) * 100).toFixed(1);
                      return (
                        <button
                          key={entry.key}
                          type="button"
                          className={`${styles.classificationLegendItem} ${isActive ? styles.classificationLegendItemActive : ""}`}
                          onClick={() => handleClasificacionClick(entry.key)}
                          aria-pressed={isActive}
                          title={`Filtrar ${entry.name}: ${entry.value.toLocaleString()} incidentes (${percentage}%)`}
                        >
                          <span className={styles.classificationLegendLabel}>
                            <span className={styles.classificationDot} style={{ backgroundColor: entry.color }} />
                            <span>{entry.name}</span>
                          </span>
                          <span className={styles.classificationLegendValue}>
                            <strong>{entry.value.toLocaleString()}</strong>
                            <small>{percentage}%</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyChartState}>No hay incidentes clasificados en este período.</div>
              )}
            </div>



            <GraficoTipoEvento
              resumen={resumen}
              filtros={filtros}
              setFiltros={setFiltros}
              setPage={setPage}
            />

            <div className={`${styles.card} ${styles.topChartCard} ${styles.topChartWide}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <FaChartLine style={{ color: "#0f766e" }} />
                    Evolución mensual de incidentes
                  </h3>
                  <p className={styles.cardSubtitle}>Volumen de incidentes a través del tiempo. Selecciona un mes para filtrar.</p>
                </div>
                {filtros.mes && (
                  <span className={styles.activeFilterBadge}>
                    Mes: {evolucionData.find((month) => month.key === filtros.mes)?.mesCompleto || filtros.mes}
                    <button
                      type="button"
                      onClick={() => handleMesClick({ key: filtros.mes, mesCompleto: filtros.mes })}
                      title="Quitar filtro mensual"
                      aria-label="Quitar filtro mensual"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>

              {evolucionData.length > 0 ? (
                <div className={styles.monthChartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evolucionData} margin={{ top: 16, right: 12, bottom: 2, left: 2 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e8edf3" />
                      <XAxis
                        dataKey="label"
                        interval="preserveStartEnd"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickMargin={8}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        tickLine={false}
                        axisLine={false}
                        width={34}
                      />
                      <Tooltip
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.mesCompleto || label}
                        formatter={(value) => [`${Number(value).toLocaleString()} incidentes`, "Total del mes"]}
                      />
                      <Bar
                        dataKey="total"
                        name="Incidentes"
                        barSize={24}
                        isAnimationActive={!tiempoReal}
                        radius={[5, 5, 0, 0]}
                        onClick={(entry) => handleMesClick(entry?.payload || entry)}
                        cursor="pointer"
                      >
                        {evolucionData.map((month) => (
                          <Cell
                            key={`month-${month.key}`}
                            fill={filtros.mes === month.key ? "#0f766e" : "#14b8a6"}
                            opacity={filtros.mes && filtros.mes !== month.key ? 0.35 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={styles.emptyChartState}>No hay datos mensuales disponibles para mostrar.</div>
              )}
            </div>
          </div>

          <div className={styles.analyticsGrid}>
            {/* ============================================================ */}
            {/* 4. TOP 10 USUARIOS CON MAYOR VOLUMEN DE INCIDENTES */}
            {/* ============================================================ */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>
                    <FaUserSecret style={{ color: "#7c3aed" }} />
                    Top 10 Usuarios con Mayor Compromiso
                  </h3>
                  <p className={styles.cardSubtitle}>Actores recurrentes en saltos o eventos anómalos.</p>
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
                    const colorBadge = maxScorePct >= 75 ? "#dc2626" : maxScorePct >= 50 ? "#ea580c" : "#eab308";
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
                    const colorBadge = maxScorePct >= 75 ? "#dc2626" : maxScorePct >= 50 ? "#ea580c" : "#eab308";
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
        </div>
      )}
    </div>
  );
}
