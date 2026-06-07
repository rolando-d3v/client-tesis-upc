import { useState, useCallback, useMemo } from "react";
import "../anomalias.css";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_FULL = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

/**
 * Interpola entre dos colores RGB según un ratio 0-1
 */
function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * Retorna un color de gradiente basado en la intensidad (0 a 1)
 * Escala: transparente → púrpura suave → púrpura → rosa → rojo
 */
function getHeatColor(count, maxCount) {
  if (count === 0) return "rgba(148, 163, 184, 0.04)";

  const ratio = Math.min(count / maxCount, 1);

  // Gradiente multi-stop: púrpura → rosa → rojo
  const stops = [
    { pos: 0, color: [192, 132, 252], alpha: 0.15 }, // púrpura muy suave
    { pos: 0.25, color: [192, 132, 252], alpha: 0.35 }, // púrpura
    { pos: 0.5, color: [168, 85, 247], alpha: 0.55 }, // púrpura intenso
    { pos: 0.75, color: [244, 114, 182], alpha: 0.7 }, // rosa
    { pos: 1, color: [248, 113, 113], alpha: 0.85 }, // rojo
  ];

  // Encontrar el segmento correcto
  let lower = stops[0],
    upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (ratio >= stops[i].pos && ratio <= stops[i + 1].pos) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const segmentRatio =
    upper.pos === lower.pos
      ? 0
      : (ratio - lower.pos) / (upper.pos - lower.pos);
  const rgb = lerpColor(lower.color, upper.color, segmentRatio);
  const alpha = lower.alpha + (upper.alpha - lower.alpha) * segmentRatio;

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export default function HeatmapSemana({ data = [] }) {
  const [tooltip, setTooltip] = useState(null);

  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.cantidad), 1),
    [data]
  );

  // Lookup rápido
  const lookup = useMemo(() => {
    const map = {};
    data.forEach((item) => {
      map[`${item.hora_num}-${item.dia_num}`] = item.cantidad;
    });
    return map;
  }, [data]);

  // Horas a mostrar como etiquetas (cada 2 horas para no saturar, pero todas las celdas se renderizan)
  const horasLabel = useMemo(() => {
    const set = new Set();
    for (let h = 0; h < 24; h += 2) set.add(h);
    return set;
  }, []);

  const handleMouseEnter = useCallback(
    (e, hora, dia, count) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        hora: `${String(hora).padStart(2, "0")}:00`,
        dia: DIAS_FULL[dia],
        count,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!data.length) return null;

  return (
    <div className="heatmap-wrapper">
      {/* Grid del Heatmap */}
      <div className="heatmap-container">
        <div className="heatmap-grid-v2">
          {/* Esquina vacía */}
          <div className="heatmap-corner" />

          {/* Headers de días */}
          {DIAS.map((dia, i) => (
            <div
              key={dia}
              className={`heatmap-day-header ${i >= 5 ? "weekend" : ""}`}
            >
              <span className="day-short">{dia}</span>
            </div>
          ))}

          {/* Filas de horas */}
          {Array.from({ length: 24 }, (_, hora) => {
            const showLabel = horasLabel.has(hora);
            return (
              <div key={`row-${hora}`} className="heatmap-row">
                {/* Etiqueta de hora */}
                <div className="heatmap-hour-label">
                  {showLabel && (
                    <span>{String(hora).padStart(2, "0")}:00</span>
                  )}
                </div>

                {/* 7 celdas por día */}
                {Array.from({ length: 7 }, (_, dia) => {
                  const count = lookup[`${hora}-${dia}`] || 0;
                  const bg = getHeatColor(count, maxCount);

                  return (
                    <div
                      key={`${hora}-${dia}`}
                      className={`heatmap-cell-v2 ${count > 0 ? "has-data" : ""}`}
                      style={{ "--cell-bg": bg }}
                      onMouseEnter={(e) =>
                        handleMouseEnter(e, hora, dia, count)
                      }
                      onMouseLeave={handleMouseLeave}
                    >
                      {count > 0 && maxCount > 0 && count / maxCount > 0.6 && (
                        <span className="cell-count">{count}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="heatmap-legend-v2">
        <span className="legend-label">Menor frecuencia</span>
        <div className="legend-gradient">
          {Array.from({ length: 7 }, (_, i) => {
            const ratio = i / 6;
            const fakeCount = ratio * maxCount;
            const bg = i === 0 ? "rgba(148, 163, 184, 0.04)" : getHeatColor(fakeCount, maxCount);
            return (
              <div
                key={i}
                className="legend-swatch"
                style={{ background: bg }}
              />
            );
          })}
        </div>
        <span className="legend-label">Mayor frecuencia</span>
      </div>

      {/* Tooltip flotante */}
      {tooltip && (
        <div
          className="heatmap-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          <div className="heatmap-tooltip-day">{tooltip.dia}</div>
          <div className="heatmap-tooltip-hour">{tooltip.hora}</div>
          <div className="heatmap-tooltip-count">
            <span className="count-number">{tooltip.count}</span>
            <span className="count-label">
              {tooltip.count === 1 ? "anomalía" : "anomalías"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
