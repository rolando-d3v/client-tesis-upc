import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">Registro #{d.id_registro}</p>
        <p className="tooltip-value">
          Score: {d.score.toFixed(4)}
        </p>
        <p className="tooltip-label" style={{ marginTop: 4 }}>
          {d.anomalia === -1 ? "🚨 Anomalía" : "✅ Normal"}
        </p>
      </div>
    );
  }
  return null;
};

export default function ScatterScores({ data = [] }) {
  if (!data.length) return null;

  const normales = data.filter((d) => d.anomalia === 1);
  const anomalias = data.filter((d) => d.anomalia === -1);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(148,163,184,0.08)"
        />
        <XAxis
          dataKey="id_registro"
          name="ID"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={{ stroke: "rgba(148,163,184,0.1)" }}
          tickLine={false}
          label={{
            value: "ID Registro",
            position: "insideBottom",
            offset: -5,
            style: { fill: "#64748b", fontSize: 11 },
          }}
        />
        <YAxis
          dataKey="score"
          name="Score"
          tick={{ fill: "#64748b", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          label={{
            value: "Score",
            angle: -90,
            position: "insideLeft",
            style: { fill: "#64748b", fontSize: 11 },
          }}
        />
        <ZAxis range={[20, 20]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter
          name="Normal"
          data={normales}
          fill="rgba(148,163,184,0.15)"
          stroke="rgba(148,163,184,0.3)"
          strokeWidth={0.5}
        />
        <Scatter
          name="Anomalía"
          data={anomalias}
          fill="#f87171"
          stroke="#f87171"
          strokeWidth={0.5}
          style={{ filter: "drop-shadow(0 0 4px rgba(248,113,113,0.4))" }}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
