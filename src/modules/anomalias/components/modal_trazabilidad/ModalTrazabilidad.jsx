import { useState, useMemo, useEffect, useCallback } from "react";
import { useTrazabilidadDocumento } from "../../../../api/apiAnomalias";
import ArbolTrazabilidad from "./ArbolTrazabilidad";
import styles from "./ModalTrazabilidad.module.css";

// Badge de clasificación de seguridad
function getBadgeClass(clasificacion) {
  const c = clasificacion?.toLowerCase() || "";
  if (c.includes("secreto")) return `${styles.badge} ${styles.badgeSecreto}`;
  if (c.includes("reservado")) return `${styles.badge} ${styles.badgeReservado}`;
  if (c.includes("confidencial")) return `${styles.badge} ${styles.badgeConfidencial}`;
  return `${styles.badge} ${styles.badgeComun}`;
}

function formatDateTime(dateStr) {
  if (!dateStr || dateStr === "-") return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return String(dateStr);
  }
}

export default function ModalTrazabilidad({ idDocumento, numeroDoc, onClose }) {
  const [isExpandedModal, setIsExpandedModal] = useState(false);
  const [inspectedPaso, setInspectedPaso] = useState(null);
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

  // Conteo de anomalías
  const totalAnomalias = info.total_anomalias ?? pasos.filter((p) => p.es_anomalo).length;

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
                        <strong>{formatDateTime(inspectedPaso.fecha_creacion)}</strong>
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

                {/* Card 3: Métricas de Tránsito */}
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
          )}
        </div>
      </div>
    </div>
  );
}
