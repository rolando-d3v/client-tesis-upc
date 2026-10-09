import React, { useState } from "react";
import styles from "./ModalInspeccionEvento.module.css";
import { FaCopy, FaCheck, FaShieldHalved, FaBan } from "react-icons/fa6";
import RoleBadge from "../../../../components/RoleBadge";

export default function ModalInspeccionEvento({
  evento,
  onClose,
  onNeutralizarUsuario,
  isNeutralizado = false,
}) {
  const [copied, setCopied] = useState(false);

  if (!evento) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(evento, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const perfil = evento.perfil_actualizado || {};

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              <FaShieldHalved style={{ color: "#7c3aed" }} />
              Inspección Predictiva SOC — Evento #{evento.id_evento}
            </h3>
            <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Fecha/Hora: {evento.fecha_evento}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {isNeutralizado ? (
              <span
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  padding: "0.3rem 0.65rem",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <FaBan /> Cuenta Bloqueada
              </span>
            ) : (
              onNeutralizarUsuario && (
                <button
                  type="button"
                  style={{
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                  }}
                  onClick={() => {
                    const confirm = window.confirm(
                      `¿Confirmas el bloqueo preventivo y neutralización de ${evento.name_user}?`
                    );
                    if (confirm) onNeutralizarUsuario(evento);
                  }}
                >
                  <FaBan /> Neutralizar Usuario
                </button>
              )
            )}
            <button className={styles.modalClose} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Resumen principal */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Usuario</span>
            <span className={styles.summaryVal}>
              {evento.name_user} (ID: {evento.id_user})
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Rol Institucional</span>
            <span className={styles.summaryVal}>
              <RoleBadge role={evento.name_role || evento.rol || evento.role} size="medium" />
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Oficina / Dependencia</span>
            <span className={styles.summaryVal}>{evento.name_oficina}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Documento</span>
            <span className={styles.summaryVal}>
              {evento.numero_documento} [{evento.name_clasificacion || "COMUN"}]
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Acción & Volumen</span>
            <span className={styles.summaryVal}>
              {evento.name_tipo_evento} — {evento.size_archivo_mb} MB
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Nivel de Riesgo</span>
            <span
              className={styles.summaryVal}
              style={{
                color:
                  evento.nivel_riesgo === "critico"
                    ? "#dc2626"
                    : evento.nivel_riesgo === "alto"
                    ? "#ea580c"
                    : "#16a34a",
              }}
            >
              {evento.nivel_riesgo?.toUpperCase()} (Score: {evento.score_final})
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Desglose ML</span>
            <span className={styles.summaryVal}>
              IF: {evento.score_if ?? 0} | Reglas: {evento.score_reglas ?? 0}
            </span>
          </div>
        </div>

        {/* Perfiles Welford / EWMA y Línea Base */}
        <div>
          <div className={styles.sectionTitle}>
            Estadísticas Incrementales Online (Algoritmo Welford + EWMA):
          </div>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Fuente Línea Base</span>
              <span className={styles.summaryVal} style={{ color: "#7c3aed" }}>
                {perfil.fuente_linea_base || "Entrenamiento (164k filas)"}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Eventos Evaluados Usuario</span>
              <span className={styles.summaryVal}>
                {perfil.n_eventos || 1}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Media Histórica Tamaño (MB)</span>
              <span className={styles.summaryVal}>
                {perfil.tamano_mean !== undefined ? perfil.tamano_mean.toFixed(2) : "N/A"} MB
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Desviación Estándar</span>
              <span className={styles.summaryVal}>
                {perfil.tamano_std !== undefined ? perfil.tamano_std.toFixed(2) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Motivos XAI */}
        {evento.motivos && evento.motivos.length > 0 && (
          <div>
            <div className={styles.sectionTitle}>Alertas Explicables XAI:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {evento.motivos.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "0.5rem 0.8rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    color: "#991b1b",
                  }}
                >
                  <strong>[{m.codigo}]:</strong> {m.descripcion}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payload JSON */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.4rem",
            }}
          >
            <span className={styles.sectionTitle}>Payload Telemetría JSON:</span>
            <button className={styles.btnCopy} onClick={handleCopy}>
              {copied ? <FaCheck style={{ color: "#16a34a" }} /> : <FaCopy />}
              {copied ? "¡Copiado!" : "Copiar JSON"}
            </button>
          </div>
          <pre className={styles.jsonBox}>
            {JSON.stringify(evento, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
