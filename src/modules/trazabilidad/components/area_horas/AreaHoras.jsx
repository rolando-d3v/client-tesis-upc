import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./areaHoras.module.css";

const CustomTooltip = ({ active, payload, label, hasClick, onTrigger }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const esFuera = item?.fuera_horario;
    const horaTexto = String(label).includes(":") ? `${label} hrs` : `${label}:00 hrs`;
    const count = payload[0].value;
    return (
      <div
        className={styles.custom_tooltip}
        style={{
          cursor: hasClick && count > 0 ? "pointer" : "default",
          pointerEvents: "auto",
        }}
        onClick={(e) => {
          if (hasClick && count > 0 && onTrigger && item) {
            e.stopPropagation();
            onTrigger(item);
          }
        }}
      >
        <p className={styles.tooltip_label}>{horaTexto}</p>
        <p className={styles.tooltip_value}>{count} anomalías</p>
        {esFuera !== undefined && (
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              display: "inline-block",
              marginTop: "0.25rem",
              color: esFuera ? "#ea580c" : "#4f46e5",
            }}
          >
            {esFuera ? "🌙 Fuera de horario (08–16)" : "☀️ Horario laboral"}
          </span>
        )}
        {hasClick && count > 0 && (
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              display: "block",
              marginTop: "0.35rem",
              color: "#6366f1",
            }}
          >
            🔍 Clic para inspeccionar los {count} registros
          </span>
        )}
      </div>
    );
  }
  return null;
};

export default function AreaHoras({ data = [], onSelectPunto = null }) {
  if (!data.length) return null;

  const triggerSelect = (item) => {
    if (onSelectPunto && item && item.cantidad > 0) {
      onSelectPunto({
        tipo: "hora",
        valor: item.hora,
        hora_num: item.hora_num != null ? item.hora_num : parseInt(item.hora, 10),
        cantidad: item.cantidad,
        fuera_horario: item.fuera_horario,
      });
    }
  };

  const handleClick = (e) => {
    if (!onSelectPunto || !e) return;

    let item = null;

    // 1. Compatibilidad con Recharts v2 (activePayload)
    if (e.activePayload && e.activePayload.length) {
      item = e.activePayload[0].payload;
    }

    // 2. Recharts v3: activeTooltipIndex o activeIndex
    if (!item) {
      const rawIdx = e.activeTooltipIndex != null ? e.activeTooltipIndex : e.activeIndex;
      if (rawIdx != null && rawIdx !== "") {
        const idx = Number(rawIdx);
        if (!isNaN(idx) && idx >= 0 && idx < data.length) {
          item = data[idx];
        }
      }
    }

    // 3. Recharts v3: activeLabel
    if (!item && e.activeLabel != null) {
      const lbl = String(e.activeLabel).trim();
      item = data.find((d) => {
        const hStr = String(d.hora).trim();
        const hNum = String(d.hora_num).trim();
        return (
          hStr === lbl ||
          hNum === lbl ||
          hStr.startsWith(lbl) ||
          lbl.startsWith(hStr)
        );
      });
    }

    if (item) {
      triggerSelect(item);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        onClick={handleClick}
        style={{ cursor: onSelectPunto ? "pointer" : "default" }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148,163,184,0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="hora"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
          tickLine={false}
          tickFormatter={(tick) => String(tick).includes(":") ? tick : `${tick}:00`}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          wrapperStyle={{ pointerEvents: "auto", zIndex: 100 }}
          content={
            <CustomTooltip
              hasClick={Boolean(onSelectPunto)}
              onTrigger={triggerSelect}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="cantidad"
          stroke="#818cf8"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#areaGradient)"
          activeDot={{
            r: 6,
            fill: "#818cf8",
            stroke: "#ffffff",
            strokeWidth: 2,
            cursor: "pointer",
            onClick: (_evt, dotProps) => {
              const itm = dotProps?.payload || dotProps;
              if (itm) triggerSelect(itm);
            },
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
