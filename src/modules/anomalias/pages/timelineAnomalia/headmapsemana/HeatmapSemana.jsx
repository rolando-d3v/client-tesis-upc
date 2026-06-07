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
function BubbleShape({ cx, cy, payload, maxCount }) {
  const fill = getHeatColor(payload.value, maxCount);
  const ratio = maxCount > 0 ? payload.value / maxCount : 0;
  const r = payload.value === 0 ? 4 : 5 + ratio * 3;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={
        payload.value > 0 ? "rgba(192, 132, 252, 0.2)" : "transparent"
      }
      strokeWidth={payload.value > 0 ? 1 : 0}
    />
  );
}

// ============================================================
// Tooltip personalizado (glassmorphism dark)
// ============================================================
function BubbleTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className={styles.bubbleTooltip}>
      <div className={styles.bubbleTooltipDay}>{data.diaFull}</div>
      <div className={styles.bubbleTooltipHour}>{data.hour}</div>
      <div className={styles.bubbleTooltipCount}>
        <span className={styles.bubbleCountNumber}>{data.value}</span>
        <span className={styles.bubbleCountLabel}>
          {data.value === 1 ? "anomalía" : "anomalías"}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Fila de un día (un ScatterChart)
// ============================================================
function DayRow({ dayData, dayLabel, isWeekend, showXTicks, maxCount, domain }) {
  const height = showXTicks ? 80 : 70;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart
        margin={{
          top: 8,
          right: 15,
          bottom: showXTicks ? 5 : 0,
          left: 0,
        }}
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
          content={<BubbleTooltipContent />}
          wrapperStyle={{ zIndex: 100 }}
        />
        <Scatter
          data={dayData}
          isAnimationActive={false}
          shape={(props) => <BubbleShape {...props} maxCount={maxCount} />}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Componente principal
// ============================================================
export default function HeatmapSemana({ data = [] }) {
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
            // showXTicks={i === 6}
            maxCount={maxCount}
            domain={domain}
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
