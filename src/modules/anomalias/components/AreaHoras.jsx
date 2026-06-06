import {
  AreaChart,
  Area,
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

export default function AreaHoras({ data = [] }) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
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
          interval={1}
        />
        <YAxis
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="cantidad"
          stroke="#c084fc"
          strokeWidth={2.5}
          fill="url(#areaGradient)"
          dot={{ fill: "#c084fc", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#c084fc", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
