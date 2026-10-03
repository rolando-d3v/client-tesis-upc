import styles from "./StorylineTimeline.module.css";
import dayjs from "dayjs";
import {
  FaClockRotateLeft,
  FaEye,
  FaDownload,
  FaTrash,
  FaRoute,
  FaPenToSquare,
  FaTriangleExclamation,
  FaFileLines,
  FaChevronRight,
} from "react-icons/fa6";

const getIcon = (icono, nivel) => {
  switch (icono) {
    case "download":
      return <FaDownload />;
    case "trash":
      return <FaTrash />;
    case "eye_alert":
      return <FaEye />;
    case "eye":
      return <FaEye />;
    case "route_alert":
      return <FaTriangleExclamation />;
    case "route":
      return <FaRoute />;
    case "edit":
      return <FaPenToSquare />;
    default:
      return <FaFileLines />;
  }
};

const getNodeClass = (nivel) => {
  switch (nivel?.toLowerCase()) {
    case "critico":
      return styles.nodeCritico;
    case "alto":
      return styles.nodeAlto;
    case "medio":
      return styles.nodeMedio;
    default:
      return styles.nodeInfo;
  }
};

const getPhaseClass = (fase) => {
  const f = fase?.toLowerCase() || "";
  if (f.includes("reconocimiento")) return styles.phaseReconocimiento;
  if (f.includes("desvío") || f.includes("desvio")) return styles.phaseDesvio;
  if (f.includes("exfiltración") || f.includes("exfiltracion")) return styles.phaseExfiltracion;
  if (f.includes("evasión") || f.includes("evasion")) return styles.phaseEvasion;
  return styles.phaseTransito;
};

export default function StorylineTimeline({ storyline = [] }) {
  if (!storyline || storyline.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.title}>
          <FaClockRotateLeft style={{ color: "#7c3aed" }} />
          Cronología del incidente
        </div>
        <p className={styles.subtitle}>
          No hay eventos cronológicos asociados a este incidente.
        </p>
      </div>
    );
  }

  const hasTransito = storyline.some(
    (s) =>
      (s.fase || "").toLowerCase().includes("tránsito") ||
      (s.fase || "").toLowerCase().includes("acceso") ||
      s.origen === "trazabilidad"
  );
  const hasDesvio = storyline.some(
    (s) =>
      (s.fase || "").toLowerCase().includes("desvío") ||
      (s.fase || "").toLowerCase().includes("desvio") ||
      (s.fase || "").toLowerCase().includes("irregular")
  );
  const hasExfiltracion = storyline.some(
    (s) =>
      (s.fase || "").toLowerCase().includes("exfiltración") ||
      (s.fase || "").toLowerCase().includes("exfiltracion") ||
      s.icono === "download"
  );
  const hasEvasion = storyline.some(
    (s) =>
      (s.fase || "").toLowerCase().includes("evasión") ||
      (s.fase || "").toLowerCase().includes("evasion") ||
      s.icono === "trash"
  );

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <div className={styles.title}>
          <FaClockRotateLeft style={{ color: "#7c3aed" }} />
          Cronología del incidente
        </div>
        <span className={styles.stepCount}>
          {storyline.length} {storyline.length === 1 ? "evento" : "eventos"}
        </span>
      </div>
      <p className={styles.subtitle}>
        Eventos y evidencias ordenados por hora de detección.
      </p>

      {/* Etapas de actividad identificadas en el incidente */}
      <div className={styles.killChainBar}>
        <div className={`${styles.kcStep} ${hasTransito ? styles.kcStepActive : ""}`}>
          <span className={styles.kcNum}>1</span>
          <div className={styles.kcText}>
            <span className={styles.kcTitle}>Acceso / Trámite</span>
            <span className={styles.kcSub}>{hasTransito ? "Confirmado" : "No detectado"}</span>
          </div>
        </div>

        <span className={styles.kcArrow} aria-hidden="true"><FaChevronRight /></span>

        <div className={`${styles.kcStep} ${hasDesvio ? styles.kcStepAlert : ""}`}>
          <span className={styles.kcNum}>2</span>
          <div className={styles.kcText}>
            <span className={styles.kcTitle}>Desvío / Exterior</span>
            <span className={styles.kcSub}>{hasDesvio ? "Alerta de Ruta" : "Sin desvío"}</span>
          </div>
        </div>

        <span className={styles.kcArrow} aria-hidden="true"><FaChevronRight /></span>

        <div className={`${styles.kcStep} ${hasExfiltracion ? styles.kcStepCritico : ""}`}>
          <span className={styles.kcNum}>3</span>
          <div className={styles.kcText}>
            <span className={styles.kcTitle}>Exfiltración</span>
            <span className={styles.kcSub}>{hasExfiltracion ? "Descarga / Copia" : "Sin descarga"}</span>
          </div>
        </div>

        <span className={styles.kcArrow} aria-hidden="true"><FaChevronRight /></span>

        <div className={`${styles.kcStep} ${hasEvasion ? styles.kcStepEvasion : ""}`}>
          <span className={styles.kcNum}>4</span>
          <div className={styles.kcText}>
            <span className={styles.kcTitle}>Evasión</span>
            <span className={styles.kcSub}>{hasEvasion ? "Borrado detectado" : "Limpio"}</span>
          </div>
        </div>
      </div>

      <div className={styles.timeline}>
        {storyline.map((paso, index) => {
          const dtFormatted = paso.timestamp
            ? dayjs(paso.timestamp).format("DD/MM/YYYY HH:mm:ss")
            : "Hora no especificada";

          const meta = paso.metadatos || {};

          return (
            <div key={index} className={styles.step}>
              {/* Icono del nodo */}
              <div className={`${styles.nodeIcon} ${getNodeClass(paso.nivel)}`}>
                {getIcon(paso.icono, paso.nivel)}
              </div>

              {/* Tarjeta de evento */}
              <div className={styles.card}>
                <div className={styles.stepHeader}>
                  <div className={styles.headerLeft}>
                    <span className={`${styles.phaseBadge} ${getPhaseClass(paso.fase)}`}>
                      {paso.fase || "Pase"}
                    </span>
                    <span className={styles.originBadge}>
                      {paso.origen === "trazabilidad" ? "Trazabilidad" : "Evento Usuario"}
                    </span>
                  </div>
                  <span className={styles.timestamp}>{dtFormatted}</span>
                </div>

                <div className={styles.stepTitle}>{paso.titulo || paso.fase || "Evento registrado"}</div>
                <div className={styles.stepDesc}>{paso.descripcion || "Sin descripción disponible."}</div>

                {/* Metadatos adicionales */}
                <div className={styles.metaRow}>
                  {meta.usuario && (
                    <span className={styles.metaPill}>
                      Usuario: <strong>{meta.usuario}</strong>
                    </span>
                  )}
                  {meta.oficina && (
                    <span className={styles.metaPill}>
                      Oficina: {meta.oficina}
                    </span>
                  )}
                  {meta.oficina_origen && meta.oficina_destino && (
                    <span className={styles.metaPill}>
                      Ruta: {meta.oficina_origen} → {meta.oficina_destino}
                    </span>
                  )}
                  {meta.estado && (
                    <span className={styles.metaPill}>
                      Estado: {meta.estado}
                    </span>
                  )}
                  {meta.fuera_horario && (
                    <span className={`${styles.metaPill} ${styles.metaAlert}`}>
                      <FaTriangleExclamation aria-hidden="true" /> Fuera de horario laboral
                    </span>
                  )}
                  {meta.peso_mb > 0 && (
                    <span className={styles.metaPill}>
                      Archivo: {meta.peso_mb} MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
