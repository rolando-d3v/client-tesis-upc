import "../anomalias.css";

const ICONS = {
  total: "📊",
  anomalias: "🚨",
  porcentaje: "⚠️",
  secreto: "🔒",
};

export default function CardResumen({ icon = "total", label, value, sub }) {
  return (
    <div className="stat-card animate-in">
      <div className="card-icon">{ICONS[icon] || "📊"}</div>
      <div className="card-label">{label}</div>
      <div className="card-value">{value}</div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}
