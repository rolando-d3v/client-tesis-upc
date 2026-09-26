import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./lineaDias.module.css";

const formatDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return dateStr;
  const cleanDate = dateStr.split("T")[0];
  const parts = cleanDate.split(/[-/]/);
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 2 && day.length === 4) {
      return cleanDate;
    }
    if (year.length === 4 && day.length === 2) {
      return `${day}-${month}-${year}`;
    }
  }
  return dateStr;
};

const CustomTooltip = ({ active, payload, label, hasClick, onTrigger }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
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
        <p className={styles.tooltip_label}>{formatDate(label)}</p>
        <p className={styles.tooltip_value}>{count} anomalías</p>
        {hasClick && count > 0 && (
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              display: "block",
              marginTop: "0.35rem",
              color: "#c084fc",
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

export default function LineaDias({ data = [], onSelectPunto = null }) {
  if (!data.length) return null;

  const triggerSelect = (item) => {
    if (onSelectPunto && item && item.cantidad > 0) {
      onSelectPunto({
        tipo: "dia",
        valor: item.fecha,
        fecha: item.fecha,
        cantidad: item.cantidad,
      });
    }
  };

  const handleClick = (e) => {
    if (!onSelectPunto || !e) return;

    let item = null;

    // 1. Recharts v2
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
        const fStr = String(d.fecha).trim();
        return fStr === lbl || fStr.startsWith(lbl);
      });
    }

    if (item) {
      triggerSelect(item);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        onClick={handleClick}
        style={{ cursor: onSelectPunto ? "pointer" : "default" }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148,163,184,0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="fecha"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
          tickLine={false}
          tickFormatter={formatDate}
          angle={-45}
          textAnchor="end"
          height={75}
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
        <Line
          type="monotone"
          dataKey="cantidad"
          stroke="url(#lineGradient)"
          strokeWidth={2.5}
          dot={{
            fill: "#c084fc",
            r: 3.5,
            strokeWidth: 0,
            cursor: onSelectPunto ? "pointer" : "default",
          }}
          activeDot={{
            r: 6,
            fill: "#c084fc",
            stroke: "#fff",
            strokeWidth: 2,
            cursor: "pointer",
            onClick: (_evt, dotProps) => {
              const itm = dotProps?.payload || dotProps;
              if (itm) triggerSelect(itm);
            },
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
