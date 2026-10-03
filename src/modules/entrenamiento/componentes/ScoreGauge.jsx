import styles from "./ScoreGauge.module.css";
import {
  FaBolt,
  FaFileLines,
  FaUserSecret,
  FaTriangleExclamation,
  FaClock,
  FaTrash,
  FaGlobe,
  FaDownload,
} from "react-icons/fa6";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

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

  // Misma regla que correlacion_engine.py: con ambas fuentes el puntaje pesa 45% trazabilidad y
  // 55% actividad; si falta una, se usa completa la que está disponible.
  const modoFusion = incidente.modo_fusion;
  const tieneTraza = modoFusion
    ? modoFusion === "fusion" || modoFusion === "solo_trazabilidad"
    : scoreTraza > 0;
  const tieneEv = modoFusion
    ? modoFusion === "fusion" || modoFusion === "solo_eventos"
    : scoreEv > 0;
  const fusionCompleta = tieneTraza && tieneEv;
  const soloEventos = !tieneTraza && tieneEv;
  const pesoTraza = fusionCompleta ? "45%" : tieneTraza ? "100%" : null;
  const pesoEv = fusionCompleta ? "55%" : tieneEv ? "100%" : null;
  const descripcionFusion = fusionCompleta
    ? "El puntaje combina la trazabilidad del documento (45%) y la actividad del usuario (55%), junto con factores del caso."
    : tieneEv
    ? "Sin trazabilidad evaluada: el puntaje usa el 100% del score final de comportamiento de usuario, sin aplicar multiplicadores adicionales."
    : tieneTraza
    ? "Este caso no tiene actividad de usuario registrada: el puntaje usa solo la trazabilidad del documento, junto con factores del caso."
    : "No hay puntajes de trazabilidad ni de actividad registrados.";

  const clasif = (incidente.clasificacion_doc || "").toUpperCase();
  const destino = (incidente.destino_doc || "").toLowerCase();

  // Multiplicadores identificados según constantes.py
  const esSecreto = clasif === "SECRETO";
  const esReservado = clasif === "RESERVADO";
  const esExterior = destino === "exterior";
  const tieneDescarga =
    incidente.motivos_eventos?.some((m) =>
      m.codigo?.includes("DESCARGA") || m.codigo?.includes("COPIA")
    ) || incidente.storyline?.some((s) => s.icono === "download");
  const tieneBorrado = incidente.motivos_eventos?.some((m) =>
    m.codigo?.includes("ELIMINAR")
  );
  const tieneFueraHorario =
    incidente.motivos_eventos?.some((m) => m.codigo?.includes("HORARIO")) ||
    incidente.motivos_trazabilidad?.some((m) => m.codigo?.includes("MADRUGADA"));

  const esAccionCritica = tieneDescarga || tieneBorrado || incidente.storyline?.some((s) => s.fase?.includes("Desvío") || s.fase?.includes("Exfiltración"));

  // Vector de amenaza multidimensional para el Radar
  const radarData = [
    { dimension: "Traza Doc.", valor: Math.round(scoreTraza * 100), fullMark: 100 },
    { dimension: "UEBA Usuario", valor: Math.round(scoreEv * 100), fullMark: 100 },
    { dimension: "Clasificación", valor: esSecreto ? 100 : esReservado ? 75 : 25, fullMark: 100 },
    { dimension: "Trámite Ext.", valor: esExterior ? 100 : 15, fullMark: 100 },
    { dimension: "Descarga/Copia", valor: tieneDescarga ? 100 : tieneBorrado ? 90 : 15, fullMark: 100 },
    { dimension: "Fuera Horario", valor: tieneFueraHorario ? 100 : 15, fullMark: 100 },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.title}>
        <FaBolt style={{ color: "#7c3aed" }} />
        Puntaje y fuentes de riesgo
      </div>
      <p className={styles.subtitle}>{descripcionFusion}</p>

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
            <span className={styles.gaugeVal}>{(scoreCorr * 100).toFixed(1)}%</span>
            <span className={styles.gaugeMax}>{scoreCorr.toFixed(4)} / 1.0</span>
          </div>

          <div
            className={styles.badgeRiesgo}
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            Riesgo {nivel}
          </div>
        </div>

        {/* Radar del vector de amenaza multidimensional */}
        <div className={styles.radarWrapper}>
          <div className={styles.radarHeader}>
            <span>Factores evaluados</span>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart cx="50%" cy="50%" outerRadius={70} data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Severidad"
                dataKey="valor"
                stroke={colors.border}
                fill={colors.border}
                fillOpacity={0.35}
              />
              <RechartsTooltip formatter={(val) => [`${val}%`, "Intensidad"]} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Barras de desglose por fuente */}
        <div className={styles.sourcesCol}>
          {/* Trazabilidad */}
          <div className={styles.sourceItem}>
            <div className={styles.sourceHeader}>
              <span className={styles.sourceName}>
                <FaFileLines style={{ color: "#3b82f6" }} />
                Trazabilidad Documental
                <span className={styles.weightTag}>{pesoTraza ? `Peso ${pesoTraza}` : "Sin datos"}</span>
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
                <span className={styles.weightTag}>{pesoEv ? `Peso ${pesoEv}` : "Sin datos"}</span>
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

      {/* UEBA ya incluye los factores del evento; solo se ajustan al correlacionar. */}
      {soloEventos ? (
        <div className={styles.factorsSection}>
          <span className={`${styles.factorBadge} ${styles.factorNeutral}`}>
            Factores del evento incluidos en el score de comportamiento de usuario
          </span>
        </div>
      ) : (
      <div className={styles.factorsSection}>
        <div className={styles.factorsTitle}>Factores que elevan el riesgo</div>
        <div className={styles.factorsList}>
          {esSecreto && (
            <span className={styles.factorBadge}>
              <FaTriangleExclamation /> Clasificación SECRETO ({esAccionCritica ? "×1.5" : "×1.15"})
            </span>
          )}
          {esReservado && (
            <span className={styles.factorBadge}>
              <FaTriangleExclamation /> Clasificación RESERVADO ({esAccionCritica ? "×1.25" : "×1.05"})
            </span>
          )}
          {esExterior && esAccionCritica && (
            <span className={styles.factorBadge}>
              <FaGlobe /> Desvío a Exterior (×1.3)
            </span>
          )}
          {tieneDescarga && (
            <span className={styles.factorBadge}>
              <FaDownload /> Descarga / Copia Local (×1.4)
            </span>
          )}
          {tieneFueraHorario && (
            <span className={styles.factorBadge}>
              <FaClock /> Actividad Fuera de Horario ({esAccionCritica ? "×1.3" : "×1.15"})
            </span>
          )}
          {tieneBorrado && (
            <span className={styles.factorBadge}>
              <FaTrash /> Intento de Borrado / Destrucción (×1.2)
            </span>
          )}
          {!esSecreto && !esReservado && !esExterior && !tieneDescarga && !tieneFueraHorario && !tieneBorrado && (
            <span className={`${styles.factorBadge} ${styles.factorNeutral}`}>
              Sin multiplicadores críticos adicionales
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
