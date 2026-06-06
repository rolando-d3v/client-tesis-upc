import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">{payload[0].value} anomalías</p>
      </div>
    );
  }
  return null;
};

export default function BarrasOficinas({ data = [] }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148,163,184,0.08)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
        />
        <YAxis
          dataKey="oficina"
          type="category"
          width={140}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(192,132,252,0.05)" }} />
        <Bar
          dataKey="cantidad"
          radius={[0, 6, 6, 0]}
          fill="url(#barGradient)"
          barSize={18}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
