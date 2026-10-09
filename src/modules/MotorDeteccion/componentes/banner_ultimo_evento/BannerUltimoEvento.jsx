import styles from "./BannerUltimoEvento.module.css";
import RoleBadge from "../../../../components/RoleBadge";
import {
  FaUser,
  FaFileLines,
  FaTriangleExclamation,
  FaChartLine,
  FaClock,
  FaBolt,
  FaBan,
  FaCircleCheck,
} from "react-icons/fa6";

const NIVEL_LABEL = {
  critico: "Crítico",
  alto: "Alto",
  medio: "Medio",
  bajo: "Bajo",
};

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
        <h4 className={styles.emptyTitle}>En espera de actividad</h4>
        <p className={styles.emptyDesc}>
          Inicia la simulación o inyecta un evento de prueba para ver aquí la detección más reciente.
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
          <span className={`${styles.liveDot} ${getDotClass()}`} aria-hidden="true" />
          <span className={styles.eventNumber}>Evento #{evento.id_evento ?? "—"}</span>
          <span className={styles.bannerTime}>
            <FaClock aria-hidden="true" />
            {evento.fecha_evento || "En vivo"}
          </span>
        </div>

        <div className={styles.bannerActions}>
          {isNeutralizado ? (
            <span className={styles.badgeNeutralizado} role="status">
              <FaCircleCheck aria-hidden="true" /> Usuario neutralizado
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
                aria-label={`Neutralizar usuario ${evento.name_user}`}
              >
                <FaBan aria-hidden="true" />
                Neutralizar usuario
              </button>
            )
          )}
          <span className={`${styles.badgeRiesgo} ${getBadgeClass()}`} aria-label={`Riesgo ${NIVEL_LABEL[nivel] || nivel}`}>
            {NIVEL_LABEL[nivel] || nivel}
          </span>
          <span className={styles.scoreText} aria-label={`Score final ${evento.score_final ?? "no disponible"}`}>
            <span>Score final</span>
            <strong>{evento.score_final ?? "—"}</strong>
          </span>
        </div>
      </div>

      <div className={styles.gridInfo}>
        <div className={styles.colInfo}>
          <h5>Usuario</h5>
          <p className={styles.infoValue}>
            <FaUser className={styles.infoIcon} aria-hidden="true" />
            <span className={styles.infoText}>{evento.name_user || "Usuario no identificado"}</span>
            <RoleBadge role={evento.name_role || evento.rol || evento.role} size="small" />
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Documento</h5>
          <p className={styles.infoValue}>
            <FaFileLines className={styles.infoIcon} aria-hidden="true" />
            <span className={styles.infoText}>{evento.numero_documento || "Sin documento asociado"}</span>
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Acción y tamaño</h5>
          <p className={styles.infoValue}>
            <span className={styles.infoText}>{evento.name_tipo_evento || "Acción no especificada"}</span>
            <span className={styles.fileSize}>
              {evento.size_archivo_mb != null ? `${evento.size_archivo_mb} MB` : "Tamaño no disponible"}
            </span>
          </p>
        </div>

        <div className={styles.colInfo}>
          <h5>Componentes de evaluación</h5>
          <p className={styles.modelScores}>
            <span><small>Isolation Forest</small><strong>{evento.score_if ?? "0.00"}</strong></span>
            <span><small>Reglas</small><strong>{evento.score_reglas ?? "0.00"}</strong></span>
          </p>
        </div>
      </div>

      {/* Motivos XAI y Línea Base */}
      <div className={styles.motivosRow}>
        <span className={styles.chipBaseLine}>
          <FaChartLine aria-hidden="true" />
          <span>Línea base · {evento.perfil_actualizado?.fuente_linea_base || "164K"}</span>
        </span>

        {evento.motivos && evento.motivos.length > 0 && (
          evento.motivos.slice(0, 2).map((m, idx) => (
            <span key={idx} className={styles.chipMotivo}>
              <FaTriangleExclamation aria-hidden="true" /> {m.descripcion}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
