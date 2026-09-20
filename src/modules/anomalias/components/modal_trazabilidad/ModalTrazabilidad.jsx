import { useState, useMemo, useEffect, useCallback } from "react";
import { useTrazabilidadDocumento } from "../../../../api/apiAnomalias";
import ArbolTrazabilidad from "./ArbolTrazabilidad";
import styles from "./ModalTrazabilidad.module.css";

// Helper para clasificar estilo de score
function getScoreMeta(score) {
  const num = Number(score);
  if (isNaN(num)) return { label: "Normal", color: "#10b981", barColor: "#10b981", pct: 20 };
  
  if (num >= 0.85 || num < -0.05) {
    return { label: "Crítico", color: "#ef4444", barColor: "#ef4444", pct: Math.min(100, Math.round(num * 100)) };
  }
  if (num >= 0.70 || num < -0.02) {
    return { label: "Alerta", color: "#f59e0b", barColor: "#f59e0b", pct: Math.min(100, Math.round(num * 100)) };
  }
  return { label: "Normal", color: "#10b981", barColor: "#10b981", pct: Math.max(15, Math.min(100, Math.round(num * 100))) };
}

// Badge de clasificación de seguridad
function getBadgeClass(clasificacion) {
  const c = clasificacion?.toLowerCase();
  if (c === "secreto") return "badge badge-secreto";
  if (c === "reservado") return "badge badge-reservado";
  if (c === "confidencial") return "badge badge-confidencial";
  return "badge badge-comun";
}

export default function ModalTrazabilidad({ idDocumento, numeroDoc, onClose }) {
  const [viewMode, setViewMode] = useState("arbol"); // 'arbol' | 'timeline'
  const [isExpandedModal, setIsExpandedModal] = useState(false);
  const [inspectedPaso, setInspectedPaso] = useState(null);
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'anomalias' | 'exterior'
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Bloquear scroll de fondo
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Consultar endpoint de trazabilidad del documento
  const { data, isLoading, isError, error } = useTrazabilidadDocumento(idDocumento);

  const info = data?.info || {};
  const pasos = useMemo(() => data?.pasos || [], [data?.pasos]);

  // Manejo de copiado del ID
  const handleCopyId = useCallback(() => {
    if (idDocumento) {
      navigator.clipboard.writeText(String(idDocumento));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }, [idDocumento]);

  // Filtrado de pasos para vista timeline
  const filteredPasos = useMemo(() => {
    let list = pasos;

    if (filterTab === "anomalias") {
      list = list.filter((p) => p.es_anomalo);
    } else if (filterTab === "exterior") {
      list = list.filter((p) => p.es_exterior);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) => {
        return (
          p.oficina_origen?.toLowerCase().includes(q) ||
          p.oficina_destino?.toLowerCase().includes(q) ||
          p.usuario?.toLowerCase().includes(q) ||
          p.estado?.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [pasos, filterTab, searchTerm]);

  // Conteo de anomalías
  const totalAnomalias = info.total_anomalias ?? pasos.filter((p) => p.es_anomalo).length;
  const totalExterior = pasos.filter((p) => p.es_exterior).length;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${isExpandedModal ? styles.modalFullscreen : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>🗺️</div>
            <div className={styles.headerTitles}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>
                  Trazabilidad Documental: Doc. #{info.numero_doc || numeroDoc || idDocumento}
                </h2>
                <button
                  className={styles.docIdBadge}
                  onClick={handleCopyId}
                  title="Copiar ID del documento al portapapeles"
                  type="button"
                >
                  ID: {idDocumento} {copied ? "✓ Copiado" : "📋"}
                </button>
              </div>
            
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className={styles.closeBtn}
              onClick={() => setIsExpandedModal((prev) => !prev)}
              title={isExpandedModal ? "Reducir tamaño de ventana" : "Maximizar ventana"}
              type="button"
            >
              {isExpandedModal ? "🗗" : "⛶"}
            </button>
            <button className={styles.closeBtn} onClick={onClose} title="Cerrar modal (Esc)" type="button">
              ✕
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p style={{ color: "#64748b", fontWeight: 500, fontSize: "0.9rem" }}>
                Rastreando secuencia cronológica del documento #{idDocumento}...
              </p>
            </div>
          ) : isError ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚠️</div>
              <h3 className={styles.emptyTitle}>Error al cargar trazabilidad</h3>
              <p className={styles.emptyText}>
                {error?.message || "No fue posible recuperar la ruta del documento en este momento."}
              </p>
            </div>
          ) : pasos.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3 className={styles.emptyTitle}>Sin movimientos registrados</h3>
              <p className={styles.emptyText}>
                No se encontraron transferencias u operaciones para el documento #{idDocumento}.
              </p>
            </div>
          ) : (
            <>
              {/* ===== SELECTOR DE MODO DE VISTA ===== */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "4px" }}>
                <div className={styles.viewModeNav}>
                  <button
                    type="button"
                    className={`${styles.viewModeBtn} ${viewMode === "arbol" ? styles.viewModeBtnActive : ""}`}
                    onClick={() => setViewMode("arbol")}
                  >
                    <span>🌳</span>
                    <span>Diagrama de Árbol (80% Visor / 20% KPIs)</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewModeBtn} ${viewMode === "timeline" ? styles.viewModeBtnActive : ""}`}
                    onClick={() => setViewMode("timeline")}
                  >
                    <span>📋</span>
                    <span>Línea de Tiempo Detallada</span>
                  </button>
                </div>

                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {viewMode === "arbol"
                    ? "Lienzo interactivo: rueda para zoom · arrastre continuo con ratón"
                    : `${filteredPasos.length} pasos filtrados`}
                </div>
              </div>

              {/* ===== VISTA 1: SPLIT 80% ÁRBOL / 20% KPI CARDS ===== */}
              {viewMode === "arbol" ? (
                <div className={styles.splitLayout}>
                  {/* 80% DE ANCHO: DIAGRAMA DE ÁRBOL INTERACTIVO */}
                  <div className={styles.treeColumn80}>
                    <ArbolTrazabilidad
                      info={info}
                      pasos={pasos}
                      activePaso={inspectedPaso}
                      onSelectPaso={setInspectedPaso}
                    />
                  </div>

                  {/* 20% DE ANCHO: DATOS Y KPICARDS VERTICALES */}
                  <aside className={styles.kpiSidebar20}>
                    {/* Tarjeta dinámica: Inspección de Movimiento Activo */}
                    {inspectedPaso ? (
                      <div
                        className={`${styles.kpiSidebarCard} ${
                          inspectedPaso.es_anomalo ? styles.kpiCardAlert : ""
                        }`}
                        style={{
                          border: "2px solid #3b82f6",
                          boxShadow: "0 6px 18px rgba(59, 130, 246, 0.18)",
                          background: inspectedPaso.es_anomalo ? "#fff8f8" : "#f0f7ff",
                        }}
                      >
                        <div className={styles.kpiCardHeader} style={{ justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "14px" }}>🔍</span>
                            <span className={styles.kpiCardTitle} style={{ color: "#1d4ed8" }}>
                              Paso #{inspectedPaso.paso} Activo
                            </span>
                          </div>
                          <button
                            onClick={() => setInspectedPaso(null)}
                            style={{
                              background: "rgba(0,0,0,0.06)",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "11px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#64748b",
                            }}
                            title="Deseleccionar paso"
                            type="button"
                          >
                            ✕
                          </button>
                        </div>
                        <div className={styles.kpiRouteFlow}>
                          <div className={styles.kpiRouteItem}>
                            <span className={styles.kpiRouteRole}>Origen:</span>
                            <span className={styles.kpiRouteName}>{inspectedPaso.oficina_origen}</span>
                          </div>
                          <div className={styles.kpiRouteArrowDown}>➔</div>
                          <div className={styles.kpiRouteItem}>
                            <span className={styles.kpiRouteRole}>Destino:</span>
                            <span className={styles.kpiRouteName}>{inspectedPaso.oficina_destino}</span>
                          </div>
                        </div>
                        <div className={styles.kpiDetailGrid}>
                          <div className={styles.kpiDetailRow}>
                            <span>Operador:</span>
                            <strong>{inspectedPaso.usuario}</strong>
                          </div>
                          <div className={styles.kpiDetailRow}>
                            <span>Estado:</span>
                            <strong>{inspectedPaso.estado}</strong>
                          </div>
                          <div className={styles.kpiDetailRow}>
                            <span>Fecha:</span>
                            <strong>{inspectedPaso.fecha_creacion}</strong>
                          </div>
                          <div className={styles.kpiDetailRow}>
                            <span>Delta:</span>
                            <strong>{inspectedPaso.tiempo_transcurrido || "-"}</strong>
                          </div>
                          <div className={styles.kpiDetailRow}>
                            <span>Score IF:</span>
                            <strong style={{ color: inspectedPaso.es_anomalo ? "#dc2626" : "#059669" }}>
                              {inspectedPaso.score != null ? inspectedPaso.score.toFixed(4) : "-"}
                              {inspectedPaso.es_anomalo ? " ⚠️" : " ✓"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "8px 12px",
                          background: "#f1f5f9",
                          borderRadius: "10px",
                          fontSize: "11px",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          border: "1px dashed #cbd5e1",
                        }}
                      >
                        <span>💡</span>
                        <span>Haz clic en cualquier nodo para inspeccionar sus datos aquí.</span>
                      </div>
                    )}

                    {/* Card 1: Evaluación de Anomalías del Pipeline */}
                    <div
                      className={`${styles.kpiSidebarCard} ${
                        totalAnomalias > 0 ? styles.kpiCardAlert : styles.kpiCardSafe
                      }`}
                    >
                      <div className={styles.kpiCardHeader}>
                        <div
                          className={`${styles.kpiCardIconWrap} ${
                            totalAnomalias > 0 ? styles.kpiIconAlert : styles.kpiIconSafe
                          }`}
                        >
                          {totalAnomalias > 0 ? "⚠️" : "🛡️"}
                        </div>
                        <span className={styles.kpiCardTitle}>Seguridad Pipeline</span>
                      </div>
                      <div
                        className={styles.kpiCardMainVal}
                        style={{ color: totalAnomalias > 0 ? "#dc2626" : "#16a34a" }}
                      >
                        {totalAnomalias > 0
                          ? `${totalAnomalias} anomalía${totalAnomalias > 1 ? "s" : ""}`
                          : "Ruta 100% Segura"}
                      </div>
                      <span className={styles.kpiCardSubtext}>
                        Score Máx: {(info.max_score || 0).toFixed(4)}
                      </span>
                    </div>

                    {/* Card 2: Ruta de Transferencia */}
                    <div className={styles.kpiSidebarCard}>
                      <div className={styles.kpiCardHeader}>
                        <div className={`${styles.kpiCardIconWrap} ${styles.kpiIconRoute}`}>🏢</div>
                        <span className={styles.kpiCardTitle}>Ruta Extremo a Extremo</span>
                      </div>
                      <div className={styles.kpiRouteFlow}>
                        <div className={styles.kpiRouteItem}>
                          <span className={styles.kpiRouteRole}>Origen Inicial:</span>
                          <span className={styles.kpiRouteName} title={info.oficina_inicial}>
                            {info.oficina_inicial || pasos[0]?.oficina_origen || "-"}
                          </span>
                        </div>
                        <div className={styles.kpiRouteArrowDown}>↓</div>
                        <div className={styles.kpiRouteItem}>
                          <span className={styles.kpiRouteRole}>Destino Final:</span>
                          <span className={styles.kpiRouteName} title={info.oficina_final}>
                            {info.oficina_final || pasos[pasos.length - 1]?.oficina_destino || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Métricas de Trámite */}
                    <div className={styles.kpiSidebarCard}>
                      <div className={styles.kpiCardHeader}>
                        <div className={`${styles.kpiCardIconWrap} ${styles.kpiIconSteps}`}>🔄</div>
                        <span className={styles.kpiCardTitle}>Métricas de Tránsito</span>
                      </div>
                      <div className={styles.kpiDetailGrid}>
                        <div className={styles.kpiDetailRow}>
                          <span>Movimientos:</span>
                          <strong>{pasos.length} pasos</strong>
                        </div>
                        <div className={styles.kpiDetailRow}>
                          <span>Oficinas Únicas:</span>
                          <strong>{info.total_oficinas_unicas || "-"} dependencias</strong>
                        </div>
                        <div className={styles.kpiDetailRow}>
                          <span>Duración Total:</span>
                          <strong>{info.duracion_total || "-"}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Ficha del Documento */}
                    <div className={styles.kpiSidebarCard}>
                      <div className={styles.kpiCardHeader}>
                        <div className={`${styles.kpiCardIconWrap} ${styles.kpiIconTime}`}>📄</div>
                        <span className={styles.kpiCardTitle}>Ficha del Documento</span>
                      </div>
                      <div className={styles.kpiDetailGrid}>
                        <div className={styles.kpiDetailRow}>
                          <span>N° Doc:</span>
                          <strong>#{info.numero_doc || idDocumento}</strong>
                        </div>
                        <div className={styles.kpiDetailRow}>
                          <span>Tipo:</span>
                          <strong>{info.tipo_documento || "-"}</strong>
                        </div>
                        <div className={styles.kpiDetailRow}>
                          <span>Clasificación:</span>
                          <span className={getBadgeClass(info.clasificacion)} style={{ fontSize: "10px", padding: "1px 5px" }}>
                            {info.clasificacion || "COMUN"}
                          </span>
                        </div>
                        <div className={styles.kpiDetailRow}>
                          <span>Peso:</span>
                          <strong>{info.peso_mb != null ? `${info.peso_mb.toFixed(2)} MB` : "-"}</strong>
                        </div>
                        <div className={styles.kpiDetailRow}>
                          <span>Prioridad:</span>
                          <strong>{info.prioridad || "-"}</strong>
                        </div>
                        {info.fecha_doc && (
                          <div className={styles.kpiDetailRow}>
                            <span>Fecha Doc:</span>
                            <strong>{info.fecha_doc}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </aside>
                </div>
              ) : (
                /* ===== VISTA 2: TIMELINE DETALLADO ===== */
                <>
                  {/* ===== KPI RESUMEN DE RUTA EN GRID ===== */}
                  <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                      <div className={`${styles.kpiIconWrap} ${styles.kpiIconRoute}`}>🏢</div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Oficina Origen Inicial</span>
                        <span className={styles.kpiValue} title={info.oficina_inicial}>
                          {info.oficina_inicial || pasos[0]?.oficina_origen || "-"}
                        </span>
                        <span className={styles.kpiSubvalue}>Paso #1</span>
                      </div>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={`${styles.kpiIconWrap} ${styles.kpiIconRoute}`}>🏁</div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Oficina Destino Final</span>
                        <span className={styles.kpiValue} title={info.oficina_final}>
                          {info.oficina_final || pasos[pasos.length - 1]?.oficina_destino || "-"}
                        </span>
                        <span className={styles.kpiSubvalue}>Paso #{pasos.length}</span>
                      </div>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={`${styles.kpiIconWrap} ${styles.kpiIconSteps}`}>🔄</div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Movimientos de Trámite</span>
                        <span className={styles.kpiValue}>{pasos.length} pasos</span>
                        <span className={styles.kpiSubvalue}>
                          {info.total_oficinas_unicas || new Set(pasos.map((p) => p.oficina_origen)).size} dependencias visitadas
                        </span>
                      </div>
                    </div>

                    <div className={styles.kpiCard}>
                      <div className={`${styles.kpiIconWrap} ${styles.kpiIconTime}`}>⏱️</div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Duración de Ruta</span>
                        <span className={styles.kpiValue}>{info.duracion_total || "-"}</span>
                        <span className={styles.kpiSubvalue}>Desde creación hasta último paso</span>
                      </div>
                    </div>

                    <div
                      className={`${styles.kpiCard} ${
                        totalAnomalias > 0 ? styles.alertCard : styles.safeCard
                      }`}
                    >
                      <div
                        className={`${styles.kpiIconWrap} ${
                          totalAnomalias > 0 ? styles.kpiIconAlert : styles.kpiIconSafe
                        }`}
                      >
                        {totalAnomalias > 0 ? "⚠️" : "🛡️"}
                      </div>
                      <div className={styles.kpiContent}>
                        <span className={styles.kpiLabel}>Evaluación del Pipeline</span>
                        <span
                          className={styles.kpiValue}
                          style={{ color: totalAnomalias > 0 ? "#dc2626" : "#16a34a" }}
                        >
                          {totalAnomalias > 0
                            ? `${totalAnomalias} anomalía${totalAnomalias > 1 ? "s" : ""} detectada${totalAnomalias > 1 ? "s" : ""}`
                            : "Ruta 100% Segura"}
                        </span>
                        <span className={styles.kpiSubvalue}>
                          Score máx: {(info.max_score || 0).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ===== STEPPER HORIZONTAL DE LA RUTA ===== */}
                  <div className={styles.pipelineSection}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>
                        <span>⛓️</span> Cadena de Traspaso entre Oficinas
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Desliza horizontalmente para ver toda la secuencia
                      </span>
                    </div>
                    <div className={styles.stepperContainer}>
                      {pasos.map((step, idx) => (
                        <div key={step.id_registro || idx} style={{ display: "flex", alignItems: "center" }}>
                          <div
                            className={`${styles.stepNode} ${
                              step.es_anomalo ? styles.stepNodeAnomalo : ""
                            }`}
                            title={`Paso ${step.paso}: ${step.oficina_origen} ➔ ${step.oficina_destino} | Estado: ${step.estado}`}
                          >
                            <div className={styles.stepNodeIndex}>
                              <span>Paso #{step.paso}</span>
                              {step.es_anomalo && <span style={{ color: "#ef4444" }}>⚠️</span>}
                            </div>
                            <div className={styles.stepNodeOffice}>
                              {step.oficina_destino || step.oficina_origen}
                            </div>
                            <span className={styles.stepNodeState}>{step.estado || "OPERADO"}</span>
                          </div>
                          {idx < pasos.length - 1 && (
                            <div className={styles.stepConnector}>➔</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ===== TOOLBAR Y FILTROS ===== */}
                  <div className={styles.toolbar}>
                    <div className={styles.filterChips}>
                      <button
                        className={`${styles.chip} ${filterTab === "all" ? styles.chipActive : ""}`}
                        onClick={() => setFilterTab("all")}
                        type="button"
                      >
                        <span>Todos los movimientos</span>
                        <strong>({pasos.length})</strong>
                      </button>

                      <button
                        className={`${styles.chip} ${
                          filterTab === "anomalias" ? styles.chipActiveAlert : ""
                        }`}
                        onClick={() => setFilterTab("anomalias")}
                        type="button"
                      >
                        <span>⚠️ Solo anomalías</span>
                        <strong>({totalAnomalias})</strong>
                      </button>

                      {totalExterior > 0 && (
                        <button
                          className={`${styles.chip} ${
                            filterTab === "exterior" ? styles.chipActive : ""
                          }`}
                          onClick={() => setFilterTab("exterior")}
                          type="button"
                        >
                          <span>🌐 Al exterior</span>
                          <strong>({totalExterior})</strong>
                        </button>
                      )}
                    </div>

                    <div className={styles.searchBox}>
                      <span className={styles.searchIcon}>🔍</span>
                      <input
                        type="text"
                        placeholder="Buscar oficina, usuario o estado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                  </div>

                  {/* ===== TIMELINE CRONOLÓGICO DETALLADO ===== */}
                  <div className={styles.timeline}>
                    {filteredPasos.length === 0 ? (
                      <div className={styles.emptyState} style={{ padding: "2rem" }}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                          No se encontraron movimientos con los filtros aplicados.
                        </p>
                      </div>
                    ) : (
                      filteredPasos.map((step) => {
                        const scoreMeta = getScoreMeta(step.score);
                        return (
                          <div
                            key={step.id_registro || step.paso}
                            className={`${styles.timelineCard} ${
                              step.es_anomalo ? styles.cardAnomalo : styles.cardNormal
                            }`}
                          >
                            <div className={styles.timelineCardHeader}>
                              <div className={styles.stepMeta}>
                                <span className={styles.stepPill}>Paso #{step.paso}</span>
                                <span className={styles.stepTime}>
                                  📅 {step.fecha_creacion || "-"}
                                </span>
                                {step.tiempo_transcurrido && (
                                  <span className={styles.stepDelta} title="Tiempo desde el paso anterior">
                                    ⏱️ {step.tiempo_transcurrido}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {step.es_bucle && (
                                  <span className={styles.badgeLoop} title="El documento permanece o recircula en la misma oficina">
                                    🔁 Bucle Interno
                                  </span>
                                )}
                                {step.es_exterior && (
                                  <span className={styles.badgeExterior} title="Envío con destino al exterior institucional">
                                    🌐 Destino Exterior
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "6px",
                                    background: step.es_anomalo ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                    color: step.es_anomalo ? "#dc2626" : "#059669",
                                  }}
                                >
                                  {step.es_anomalo ? "⚠️ Anomalía Detectada" : "✓ Normal"}
                                </span>
                              </div>
                            </div>

                            <div className={styles.routeRow}>
                              <div className={styles.officeBox}>
                                <span className={styles.officeRole}>Origen</span>
                                <span className={styles.officeName}>{step.oficina_origen || "-"}</span>
                              </div>

                              <div className={styles.routeArrow}>➔</div>

                              <div className={styles.officeBox}>
                                <span className={styles.officeRole}>Destino</span>
                                <span className={styles.officeName}>{step.oficina_destino || "-"}</span>
                              </div>
                            </div>

                            <div className={styles.detailsGrid}>
                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>👤 Operador / Usuario</span>
                                <span className={styles.detailVal}>{step.usuario || "-"}</span>
                              </div>

                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>📄 Estado del Trámite</span>
                                <span className={styles.detailVal}>{step.estado || "-"}</span>
                              </div>

                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>🏷️ Tipo / Clasificación</span>
                                <span className={styles.detailVal}>
                                  {step.tipo_documento} · {step.clasificacion}
                                </span>
                              </div>

                              <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>📦 Peso / Prioridad</span>
                                <span className={styles.detailVal}>
                                  {step.peso_mb != null ? `${step.peso_mb.toFixed(2)} MB` : "-"} · {step.prioridad || "COMUN"}
                                </span>
                              </div>
                            </div>

                            <div className={styles.scoreSection}>
                              <div className={styles.scoreLeft}>
                                <span style={{ color: "#64748b", fontWeight: 500 }}>
                                  Score Isolation Forest:
                                </span>
                                <span
                                  style={{
                                    fontFamily: "monospace",
                                    fontWeight: 700,
                                    color: scoreMeta.color,
                                  }}
                                >
                                  {step.score != null ? step.score.toFixed(4) : "0.0000"}
                                </span>
                                <div className={styles.scoreBarWrap}>
                                  <div
                                    className={styles.scoreBarFill}
                                    style={{
                                      width: `${scoreMeta.pct}%`,
                                      background: scoreMeta.barColor,
                                    }}
                                  />
                                </div>
                              </div>

                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  fontWeight: 600,
                                  color: scoreMeta.color,
                                }}
                              >
                                Nivel de Riesgo: {scoreMeta.label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

      
      </div>
    </div>
  );
}
