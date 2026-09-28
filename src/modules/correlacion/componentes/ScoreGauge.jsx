import styles from "./ScoreGauge.module.css";
import {
  FaBolt,
  FaFileLines,
  FaUserSecret,
  FaTriangleExclamation,
  FaClock,
  FaTrash,
  FaGlobe,
} from "react-icons/fa6";

const getColorByLevel = (nivel) => {
  switch (nivel?.toLowerCase()) {
    case "critico":
      return { border: "#ef4444", text: "#dc2626", bg: "rgba(239, 68, 68, 0.12)" };
    case "alto":
      return { border: "#f97316", text: "#ea580c", bg: "rgba(249, 115, 22, 0.12)" };
    case "medio":
      return { border: "#eab308", text: "#ca8a04", bg: "rgba(234, 179, 8, 0.12)" };
    default:
      return { border: "#22c55e", text: "#16a34a", bg: "rgba(34, 197, 94, 0.12)" };
  }
};

export default function ScoreGauge({ incidente }) {
  if (!incidente) return null;

  const scoreCorr = Number(incidente.score_correlacion || 0);
  const scoreTraza = Number(incidente.score_trazabilidad || 0);
  const scoreEv = Number(incidente.score_eventos || 0);
  const nivel = incidente.nivel_riesgo || "bajo";
  const colors = getColorByLevel(nivel);

  const clasif = (incidente.clasificacion_doc || "").toUpperCase();
  const destino = (incidente.destino_doc || "").toLowerCase();

  // Multiplicadores identificados
  const esSecreto = clasif === "SECRETO";
  const esReservado = clasif === "RESERVADO";
  const esExterior = destino === "exterior";
  const tieneBorrado = incidente.motivos_eventos?.some((m) =>
    m.codigo?.includes("ELIMINAR")
  );
  const tieneFueraHorario =
    incidente.motivos_eventos?.some((m) => m.codigo?.includes("HORARIO")) ||
    incidente.motivos_trazabilidad?.some((m) => m.codigo?.includes("MADRUGADA"));

  return (
    <div className={styles.card}>
      <div className={styles.title}>
        <FaBolt style={{ color: "#7c3aed" }} />
        Evaluación de Amenaza Multi-Dominio
      </div>
      <p className={styles.subtitle}>
        Fusión algorítmica de trazabilidad documental (45%) y comportamiento de usuario (55%) con factores de contexto.
      </p>

      <div className={styles.mainRow}>
        {/* Gauge central */}
        <div className={styles.gaugeWrapper}>
          <div
            className={styles.gaugeCircle}
            style={{
              borderColor: colors.border,
              background: colors.bg,
              color: colors.text,
            }}
          >
            <span className={styles.gaugeVal}>{(scoreCorr * 100).toFixed(0)}%</span>
            <span className={styles.gaugeMax}>{scoreCorr.toFixed(4)} / 1.0</span>
          </div>

          <div
            className={styles.badgeRiesgo}
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            Riesgo {nivel}
          </div>
        </div>

        {/* Barras de desglose por fuente */}
        <div className={styles.sourcesCol}>
          {/* Trazabilidad */}
          <div className={styles.sourceItem}>
            <div className={styles.sourceHeader}>
              <span className={styles.sourceName}>
                <FaFileLines style={{ color: "#3b82f6" }} />
                Trazabilidad Documental
                <span className={styles.weightTag}>Peso 45%</span>
              </span>
              <span className={styles.sourceScore}>
                {(scoreTraza * 100).toFixed(1)}% ({scoreTraza.toFixed(4)})
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(scoreTraza * 100, 100)}%`,
                  background: "#3b82f6",
                }}
              />
            </div>
          </div>

          {/* Eventos */}
          <div className={styles.sourceItem}>
            <div className={styles.sourceHeader}>
              <span className={styles.sourceName}>
                <FaUserSecret style={{ color: "#8b5cf6" }} />
                Comportamiento de Usuario
                <span className={styles.weightTag}>Peso 55%</span>
              </span>
              <span className={styles.sourceScore}>
                {(scoreEv * 100).toFixed(1)}% ({scoreEv.toFixed(4)})
              </span>
            </div>
            <div className={styles.progressBarBg}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(scoreEv * 100, 100)}%`,
                  background: "#8b5cf6",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Factores Contextuales Multiplicadores */}
      <div className={styles.factorsSection}>
        <div className={styles.factorsTitle}>Factores Multiplicadores Activos</div>
        <div className={styles.factorsList}>
          {esSecreto && (
            <span className={styles.factorBadge}>
              <FaTriangleExclamation /> Clasificación SECRETO (×1.5)
            </span>
          )}
          {esReservado && (
            <span className={styles.factorBadge}>
              <FaTriangleExclamation /> Clasificación RESERVADO (×1.25)
            </span>
          )}
          {esExterior && (
            <span className={styles.factorBadge}>
              <FaGlobe /> Desvío a Exterior (×1.4)
            </span>
          )}
          {tieneFueraHorario && (
            <span className={styles.factorBadge}>
              <FaClock /> Actividad Fuera de Horario (×1.3)
            </span>
          )}
          {tieneBorrado && (
            <span className={styles.factorBadge}>
              <FaTrash /> Intento de Borrado / Destrucción (×1.2)
            </span>
          )}
          {!esSecreto && !esReservado && !esExterior && !tieneFueraHorario && !tieneBorrado && (
            <span className={`${styles.factorBadge} ${styles.factorNeutral}`}>
              Sin multiplicadores críticos adicionales
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
