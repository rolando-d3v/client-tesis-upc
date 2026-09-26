import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./headmap.module.css";

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
const HORAS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, "0")}:00`
);

// ============================================================
// Helpers de color
// ============================================================
function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function getHeatColor(count, maxCount) {
  if (count === 0) return "rgba(148, 163, 184, 0.06)";
  const ratio = Math.min(count / maxCount, 1);
  const stops = [
    { pos: 0, color: [28, 108, 43], alpha: 0.1 },
    { pos: 0.25, color: [0, 255, 0], alpha: 0.5 },
    { pos: 0.5, color: [254, 246, 17], alpha: 0.7 },
    { pos: 0.75, color: [255, 103, 20], alpha: 0.85 },
    { pos: 1, color: [255, 0, 0], alpha: 0.99 },
  ];
  let lower = stops[0],
    upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (ratio >= stops[i].pos && ratio <= stops[i + 1].pos) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }
  const t =
    upper.pos === lower.pos
      ? 0
      : (ratio - lower.pos) / (upper.pos - lower.pos);
  const rgb = lerpColor(lower.color, upper.color, t);
  const alpha = lower.alpha + (upper.alpha - lower.alpha) * t;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

// ============================================================
// Burbuja personalizada (shape de Scatter)
// ============================================================
function BubbleShape({ cx, cy, payload, maxCount, onClick }) {
  const fill = getHeatColor(payload.value, maxCount);
  const ratio = maxCount > 0 ? payload.value / maxCount : 0;
  const r = payload.value === 0 ? 4 : 5 + ratio * 3;
  const isClickable = payload.value > 0 && typeof onClick === "function";

  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={
        payload.value > 0 ? "rgba(192, 132, 252, 0.4)" : "transparent"
      }
      strokeWidth={payload.value > 0 ? 1.2 : 0}
      style={{
        cursor: isClickable ? "pointer" : "default",
        transition: "all 0.15s ease",
      }}
      onClick={(e) => {
        if (isClickable) {
          e.stopPropagation();
          onClick(payload);
        }
      }}
    />
  );
}

// ============================================================
// Tooltip personalizado (glassmorphism dark)
// ============================================================
function BubbleTooltipContent({ active, payload, hasClick, onTrigger }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div
      className={styles.bubbleTooltip}
      style={{
        cursor: hasClick && data.value > 0 ? "pointer" : "default",
        pointerEvents: "auto",
      }}
      onClick={(e) => {
        if (hasClick && data.value > 0 && onTrigger) {
          e.stopPropagation();
          onTrigger(data);
        }
      }}
    >
      <div className={styles.bubbleTooltipDay}>{data.diaFull}</div>
      <div className={styles.bubbleTooltipHour}>{data.hour}</div>
      <div className={styles.bubbleTooltipCount}>
        <span className={styles.bubbleCountNumber}>{data.value}</span>
        <span className={styles.bubbleCountLabel}>
          {data.value === 1 ? "anomalía" : "anomalías"}
        </span>
      </div>
      {hasClick && data.value > 0 && (
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            marginTop: "0.35rem",
            color: "#c084fc",
          }}
        >
          🔍 Clic para inspeccionar
        </div>
      )}
    </div>
  );
}

// ============================================================
// Fila de un día (un ScatterChart)
// ============================================================
function DayRow({
  dayData,
  dayLabel,
  isWeekend,
  showXTicks,
  maxCount,
  domain,
  onSelectPunto,
}) {
  const height = showXTicks ? 80 : 70;

  const handleBubbleClick = (item) => {
    if (onSelectPunto && item && item.value > 0) {
      onSelectPunto({
        tipo: "heatmap",
        diaFull: item.diaFull,
        dia_num: item.dia_num,
        hora: item.hour,
        hora_num: item.hora_num != null ? item.hora_num : parseInt(item.hour, 10),
        cantidad: item.value,
      });
    }
  };

  const handleChartClick = (e) => {
    if (!onSelectPunto || !e) return;

    let item = null;

    // 1. Recharts v2 format
    if (e.activePayload && e.activePayload.length) {
      item = e.activePayload[0].payload;
    }

    // 2. Recharts v3: activeTooltipIndex o activeIndex
    if (!item) {
      const rawIdx = e.activeTooltipIndex != null ? e.activeTooltipIndex : e.activeIndex;
      if (rawIdx != null && rawIdx !== "") {
        const idx = Number(rawIdx);
        if (!isNaN(idx) && idx >= 0 && idx < dayData.length) {
          item = dayData[idx];
        }
      }
    }

    // 3. Recharts v3: activeLabel
    if (!item && e.activeLabel != null) {
      const lbl = String(e.activeLabel).trim();
      item = dayData.find((d) => {
        const hStr = String(d.hour).trim();
        return hStr === lbl || hStr.startsWith(lbl);
      });
    }

    if (item && item.value > 0) {
      handleBubbleClick(item);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart
        margin={{
          top: 8,
          right: 15,
          bottom: showXTicks ? 5 : 0,
          left: 0,
        }}
        onClick={handleChartClick}
        style={{ cursor: onSelectPunto ? "pointer" : "default" }}
      >
        <XAxis
          type="category"
          dataKey="hour"
          name="hour"
          interval={showXTicks ? 1 : 0}
          tick={
            showXTicks
              ? { fontSize: 9, fill: "#64748b", fontFamily: "Inter, sans-serif" }
              : { fontSize: 0 }
          }
          tickLine={
            showXTicks
              ? { stroke: "#334155", transform: "translate(0, -6)" }
              : false
          }
          tickFormatter={showXTicks ? (v) => parseInt(v) + "h" : undefined}
          axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
        />
        <YAxis
          type="number"
          dataKey="index"
          width={48}
          tick={false}
          tickLine={false}
          axisLine={false}
          label={{
            value: dayLabel,
            position: "insideRight",
            style: {
              fill: isWeekend ? "#c084fc" : "#94a3b8",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              letterSpacing: "0.5px",
            },
          }}
        />
        <ZAxis type="number" dataKey="value" domain={domain} range={[80, 600]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3", stroke: "rgba(192, 132, 252, 0.15)" }}
          content={
            <BubbleTooltipContent
              hasClick={Boolean(onSelectPunto)}
              onTrigger={handleBubbleClick}
            />
          }
          wrapperStyle={{ zIndex: 100, pointerEvents: "auto" }}
        />
        <Scatter
          data={dayData}
          isAnimationActive={false}
          onClick={(node) => {
            const p = node?.payload || node;
            if (p && p.value > 0) handleBubbleClick(p);
          }}
          shape={(props) => (
            <BubbleShape
              {...props}
              maxCount={maxCount}
              onClick={handleBubbleClick}
            />
          )}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Componente principal
// ============================================================
export default function HeatmapSemana({ data = [], onSelectPunto = null }) {
  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.cantidad), 1),
    [data]
  );

  const domain = useMemo(() => [0, maxCount], [maxCount]);

  // Agrupar datos por día (0-6) y rellenar horas faltantes
  const dataByDay = useMemo(() => {
    const grouped = {};
    for (let d = 0; d < 7; d++) grouped[d] = [];

    data.forEach((item) => {
      const hourLabel = `${String(item.hora_num).padStart(2, "0")}:00`;
      grouped[item.dia_num].push({
        hour: hourLabel,
        index: 1,
        value: item.cantidad,
        diaFull: DIAS_FULL[item.dia_num],
        dia_num: item.dia_num,
        hora_num: item.hora_num,
      });
    });

    // Rellenar horas que no tengan datos
    for (let d = 0; d < 7; d++) {
      const existing = new Set(grouped[d].map((p) => p.hour));
      HORAS.forEach((h) => {
        if (!existing.has(h)) {
          grouped[d].push({
            hour: h,
            index: 1,
            value: 0,
            diaFull: DIAS_FULL[d],
            dia_num: d,
            hora_num: parseInt(h, 10),
          });
        }
      });
      grouped[d].sort((a, b) => a.hour.localeCompare(b.hour));
    }

    return grouped;
  }, [data]);

  if (!data.length) return null;

  return (
    <div className={styles.heatmapWrapper}>
      {/* 7 ScatterCharts apilados, uno por día */}
      <div className={styles.bubbleChartContainer}>
        {DIAS.map((dia, i) => (
          <DayRow
            key={dia}
            dayData={dataByDay[i]}
            dayLabel={dia}
            isWeekend={i >= 5}
            showXTicks={i === 6}
            maxCount={maxCount}
            domain={domain}
            onSelectPunto={onSelectPunto}
          />
        ))}
      </div>

      {/* Leyenda */}
      <div className={styles.heatmapLegend}>
        <span className={styles.legendLabel}>Menor frecuencia</span>
        <div className={styles.legendGradient}>
          {Array.from({ length: 7 }, (_, i) => {
            const ratio = i / 6;
            const fakeCount = ratio * maxCount;
            const bg =
              i === 0
                ? "rgba(148, 163, 184, 0.06)"
                : getHeatColor(fakeCount, maxCount);
            return (
              <div
                key={i}
                className={styles.legendSwatch}
                style={{ background: bg }}
              />
            );
          })}
        </div>
        <span className={styles.legendLabel}>Mayor frecuencia</span>
      </div>
    </div>
  );
}
