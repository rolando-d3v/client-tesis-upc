import React from "react";
import styles from "./BannerUltimoEvento.module.css";
import RoleBadge from "../../../../../components/RoleBadge";
import {
  FaUser,
  FaFileLines,
  FaTriangleExclamation,
  FaChartLine,
  FaClock,
} from "react-icons/fa6";

export default function BannerUltimoEvento({
  evento,
  onNeutralizarUsuario,
  isNeutralizado = false,
}) {
  if (!evento) {
    return (
      <div className={styles.banner} style={{ textAlign: "center", padding: "1.75rem 1rem" }}>
        <p style={{ color: "#6b7280", margin: 0, fontSize: "0.92rem" }}>
          ⏳ <strong>Flujo a la espera:</strong> Inicia la simulación arriba o carga un archivo CSV para evaluar peticiones en tiempo real registro a registro.
        </p>
      </div>
    );
  }

  const nivel = (evento.nivel_riesgo || "bajo").toLowerCase();

  const getBannerClass = () => {
    switch (nivel) {
      case "critico":
        return styles.bannerCritico;
      case "alto":
        return styles.bannerAlto;
      case "medio":
        return styles.bannerMedio;
      default:
        return styles.bannerBajo;
    }
  };

  const getDotClass = () => {
    switch (nivel) {
      case "critico":
        return styles.dotCritico;
      case "alto":
        return styles.dotAlto;
      case "medio":
        return styles.dotMedio;
      default:
        return styles.dotBajo;
    }
  };

  const getBadgeClass = () => {
    switch (nivel) {
      case "critico":
        return styles.badgeCritico;
      case "alto":
        return styles.badgeAlto;
      case "medio":
        return styles.badgeMedio;
      default:
        return styles.badgeBajo;
    }
  };

  return (
    <div className={`${styles.banner} ${getBannerClass()}`}>
      <div className={styles.bannerHeader}>
        <div className={styles.bannerTitle}>
          <span className={`${styles.liveDot} ${getDotClass()}`} />
          Último Registro Evaluado Online — Evento #{evento.id_evento}
          <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#6b7280", marginLeft: "0.5rem" }}>
            <FaClock style={{ marginRight: "0.25rem" }} />
            {evento.fecha_evento || "En vivo"}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {isNeutralizado ? (
            <span
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                padding: "0.2rem 0.55rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              🚫 Cuenta Bloqueada
            </span>
          ) : (
            onNeutralizarUsuario && (nivel === "critico" || nivel === "alto") && (
              <button
                type="button"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.25rem 0.65rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
                }}
                onClick={() => {
                  const confirm = window.confirm(
                    `¿Confirmas la neutralización inmediata de ${evento.name_user}?`
                  );
                  if (confirm) onNeutralizarUsuario(evento);
                }}
              >
                🚫 Neutralizar Usuario
              </button>
            )
          )}
          <span className={`${styles.badgeRiesgo} ${getBadgeClass()}`}>
            Riesgo {evento.nivel_riesgo}
          </span>
          <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#111827" }}>
            Score: {evento.score_final} (Escala: {evento.score_riesgo || 0}/30)
          </span>
        </div>
      </div>

      <div className={styles.gridInfo}>
        <div className={styles.colInfo}>
          <h5>Usuario & Dependencia</h5>
          <p style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <FaUser style={{ color: "#7c3aed" }} />
            <span>{evento.name_user}</span>
            <RoleBadge role={evento.name_role || evento.rol || evento.role} size="small" />
            <span style={{ color: "#6b7280" }}>({evento.name_oficina})</span>
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Documento</h5>
          <p>
            <FaFileLines style={{ marginRight: "0.4rem", color: "#2563eb" }} />
            {evento.numero_documento} [{evento.name_clasificacion || "COMUN"}]
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Acción & Volumen</h5>
          <p>
            {evento.name_tipo_evento} — {evento.size_archivo_mb} MB
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Desglose Modelo ML</h5>
          <p>
            IF: {evento.score_if ?? "0.00"} | Reglas: {evento.score_reglas ?? "0.00"}
          </p>
        </div>
      </div>

      {/* Motivos XAI y Fuente de Línea Base */}
      <div className={styles.motivosRow}>
        <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 700 }}>
          Línea Base:
        </span>
        <span className={styles.chipBaseLine}>
          <FaChartLine style={{ marginRight: "0.25rem" }} />
          Fuente: {evento.perfil_actualizado?.fuente_linea_base || "Entrenamiento (164k registros)"}
          {evento.perfil_actualizado?.n_eventos
            ? ` (${evento.perfil_actualizado.n_eventos} eventos acumulados)`
            : ""}
        </span>

        {evento.motivos && evento.motivos.length > 0 && (
          <>
            <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 700, marginLeft: "0.5rem" }}>
              Alertas XAI:
            </span>
            {evento.motivos.map((m, idx) => (
              <span key={idx} className={styles.chipMotivo}>
                <FaTriangleExclamation /> {m.descripcion}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
