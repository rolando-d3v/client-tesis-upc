import {
  LineChart,
  Line,
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

export default function LineaDias({ data = [] }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="cantidad"
          stroke="url(#lineGradient)"
          strokeWidth={2.5}
          dot={{ fill: "#c084fc", r: 3.5, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#c084fc", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
