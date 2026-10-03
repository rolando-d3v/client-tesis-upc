import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Legend,
} from "recharts";
import styles from "./ScatterDeteccion.module.css";
import RoleBadge from "../../../../components/RoleBadge";

const formatoNumero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const scoreIF = Number(d.score_if);
  const volumen = Number(d.total_mb);

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipName}>{d.nombre || "Usuario sin nombre"}</p>
      {(d.rol || d.role) && (
        <div className={styles.tooltipRole}>
          <RoleBadge role={d.rol || d.role} size="small" />
        </div>
      )}
      <dl className={styles.tooltipData}>
        <div>
          <dt>Score IF</dt>
          <dd>{Number.isFinite(scoreIF) ? scoreIF.toFixed(4) : "N/D"}</dd>
        </div>
        <div>
          <dt>Volumen</dt>
          <dd>{Number.isFinite(volumen) ? `${formatoNumero.format(volumen)} MB` : "N/D"}</dd>
        </div>
        <div>
          <dt>Eventos</dt>
          <dd>{formatoNumero.format(Number(d.n_eventos) || 0)}</dd>
        </div>
        <div>
          <dt>Riesgo</dt>
          <dd>{d.nivel_riesgo || "N/D"}</dd>
        </div>
      </dl>
    </div>
  );
};

const NIVELES = [
  { key: "bajo", label: "Bajo", color: "#16a34a" },
  { key: "medio", label: "Medio", color: "#ca8a04" },
  { key: "alto", label: "Alto", color: "#ea580c" },
  { key: "critico", label: "Crítico", color: "#dc2626" },
];

export default function ScatterDeteccion({ data = [] }) {
  if (!data || data.length === 0) {
    return <p className={styles.empty}>No hay perfiles de usuario para comparar.</p>;
  }

  const grupos = NIVELES.map((nivel) => ({
    ...nivel,
    data: data.filter((item) => item.nivel_riesgo === nivel.key),
  }));

  return (
    <div className={styles.chart}>
      <p className={styles.summary}>{formatoNumero.format(data.length)} usuarios en el análisis</p>
      <ResponsiveContainer width="100%" height={330}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: 8 }}>
          <CartesianGrid stroke="#e9eef5" />
          <XAxis
            type="number"
            dataKey="score_if"
            name="Score IF"
            tickFormatter={(value) => Number(value).toFixed(2)}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            label={{ value: "Score de Isolation Forest", position: "insideBottom", offset: -10, fill: "#475569", fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="total_mb"
            name="Volumen"
            tickFormatter={(value) => formatoNumero.format(Number(value) || 0)}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={52}
            label={{ value: "Volumen (MB)", angle: -90, position: "insideLeft", fill: "#475569", fontSize: 10 }}
          />
          <ZAxis type="number" dataKey="n_eventos" name="Eventos" range={[45, 220]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            height={28}
            wrapperStyle={{ fontSize: 10, color: "#475569" }}
          />
          {grupos.map((grupo) => (
            <Scatter
              key={grupo.key}
              name={grupo.label}
              data={grupo.data}
              fill={grupo.color}
              fillOpacity={0.75}
              isAnimationActive={false}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <p className={styles.chartNote}>El color representa el nivel de riesgo; el tamaño del punto, la cantidad de eventos.</p>
    </div>
  );
}
