import React from "react";
import styles from "./BannerUltimoEvento.module.css";
import RoleBadge from "../../../../../components/RoleBadge";
import {
  FaUser,
  FaFileLines,
  FaTriangleExclamation,
  FaChartLine,
  FaClock,
  FaBolt,
} from "react-icons/fa6";

export default function BannerUltimoEvento({
  evento,
  onNeutralizarUsuario,
  isNeutralizado = false,
}) {
  if (!evento) {
    return (
      <div className={styles.bannerEmpty}>
        <div className={styles.emptyIconWrapper}>
          <FaBolt className={styles.emptyRadarIcon} />
        </div>
        <h4 className={styles.emptyTitle}>Radar en Espera de Tráfico</h4>
        <p className={styles.emptyDesc}>
          Inicia la simulación arriba o inyecta una prueba para evaluar eventos en tiempo real con Isolation Forest.
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
          <span>Evento #{evento.id_evento}</span>
          <span className={styles.bannerTime}>
            <FaClock style={{ marginRight: "0.25rem" }} />
            {evento.fecha_evento || "En vivo"}
          </span>
        </div>

        <div className={styles.bannerActions}>
          {isNeutralizado ? (
            <span className={styles.badgeNeutralizado}>
              🚫 Cuenta Bloqueada
            </span>
          ) : (
            onNeutralizarUsuario && (nivel === "critico" || nivel === "alto") && (
              <button
                type="button"
                className={styles.btnNeutralizar}
                onClick={() => {
                  const confirm = window.confirm(
                    `¿Confirmas la neutralización inmediata de ${evento.name_user}?`
                  );
                  if (confirm) onNeutralizarUsuario(evento);
                }}
              >
                🚫 Neutralizar
              </button>
            )
          )}
          <span className={`${styles.badgeRiesgo} ${getBadgeClass()}`}>
            {evento.nivel_riesgo}
          </span>
          <span className={styles.scoreText}>
            Score: {evento.score_final}
          </span>
        </div>
      </div>

      <div className={styles.gridInfo}>
        <div className={styles.colInfo}>
          <h5>Usuario</h5>
          <p style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
            <FaUser style={{ color: "#7c3aed" }} />
            <span>{evento.name_user}</span>
            <RoleBadge role={evento.name_role || evento.rol || evento.role} size="small" />
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Documento</h5>
          <p>
            <FaFileLines style={{ marginRight: "0.35rem", color: "#2563eb", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {evento.numero_documento}
            </span>
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Acción & Tamaño</h5>
          <p>
            {evento.name_tipo_evento} ({evento.size_archivo_mb} MB)
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Score ML</h5>
          <p>
            IF: {evento.score_if ?? "0.00"} | Reglas: {evento.score_reglas ?? "0.00"}
          </p>
        </div>
      </div>

      {/* Motivos XAI y Línea Base */}
      <div className={styles.motivosRow}>
        <span className={styles.chipBaseLine}>
          <FaChartLine style={{ marginRight: "0.25rem" }} />
          Línea Base: {evento.perfil_actualizado?.fuente_linea_base || "164K"}
        </span>

        {evento.motivos && evento.motivos.length > 0 && (
          evento.motivos.slice(0, 2).map((m, idx) => (
            <span key={idx} className={styles.chipMotivo}>
              <FaTriangleExclamation /> {m.descripcion}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
