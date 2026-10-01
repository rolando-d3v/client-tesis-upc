import { useMemo } from "react";
import styles from "./GraficoEstadoGestion.module.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { FaShieldHalved } from "react-icons/fa6";

const COLOR_ESTADO = {
  abierto: "#dc2626", // Rojo
  en_investigacion: "#2563eb", // Azul
  contenido: "#f59e0b", // Ámbar / Naranja
  mitigado: "#16a34a", // Verde
  falso_positivo: "#64748b", // Gris
};

const NOMBRES_ESTADO = {
  abierto: "Abierto",
  en_investigacion: "En Investigación",
  contenido: "Contenido",
  mitigado: "Mitigado",
  falso_positivo: "Falso Positivo",
};

const DESCRIPCIONES_ESTADO = {
  abierto: "Incidente recién detectado sin intervención. Requiere atención prioritaria.",
  en_investigacion: "El analista SOC está recopilando trazas, revisando el storyline y entrevistando al usuario.",
  contenido: "Amenaza neutralizada. Cuenta bloqueada o archivo aislado; el riesgo inminente está controlado.",
  mitigado: "Caso cerrado formalmente con medidas correctivas aplicadas y permisos revocados.",
  falso_positivo: "Alarma descartada tras justificación técnica sin aplicación de sanciones.",
};

const ORDEN_ESTADOS = [
  "abierto",
  "en_investigacion",
  "contenido",
  "mitigado",
  "falso_positivo",
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader} style={{ color: data.color }}>
          <span
            className={styles.tooltipDot}
            style={{ backgroundColor: data.color }}
          ></span>
          {data.name}
        </div>
        <div className={styles.tooltipBody}>
          <div className={styles.tooltipStat}>
            <span className={styles.tooltipLabel}>Volumen:</span>
            <span className={styles.tooltipValue}>{data.cantidad} incidentes</span>
          </div>
          <p className={styles.tooltipDesc}>{data.descripcion}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function GraficoEstadoGestion({
  resumen,
  filtros,
  setFiltros,
  setPage,
}) {
  const chartData = useMemo(() => {
    if (!resumen || !resumen.por_estado) return [];

    return ORDEN_ESTADOS.map((key) => {
      const cantidad = resumen.por_estado[key] || 0;
      return {
        key,
        name: NOMBRES_ESTADO[key],
        cantidad,
        color: COLOR_ESTADO[key],
        descripcion: DESCRIPCIONES_ESTADO[key],
      };
    });
  }, [resumen]);

  const handleBarClick = (data) => {
    if (!data || !data.key) return;

    if (filtros.estado === data.key) {
      setFiltros((prev) => ({ ...prev, estado: "" }));
    } else {
      setFiltros((prev) => ({ ...prev, estado: data.key, nivel_riesgo: "" }));
    }
    setPage(1);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            <FaShieldHalved style={{ color: "#4f46e5" }} />
            Estado de Gestión de Incidentes
          </h3>
        
        </div>
        
        <div className={styles.controlsGroup}>
          <select
            className={styles.monthSelect}
            value={filtros.mes || ""}
            onChange={(e) => {
              setFiltros((prev) => ({ ...prev, mes: e.target.value }));
              setPage(1);
            }}
            title="Filtrar incidentes por mes"
          >
            <option value="">Todos los meses</option>
            {resumen?.evolucion_mensual
              ?.filter((m) => m.total > 0)
              .map((m) => (
                <option key={m.key} value={m.key}>
                  {m.mes_completo}
                </option>
              ))}
          </select>

          {filtros.estado && (
            <span className={styles.activeFilter}>
              Filtro: {NOMBRES_ESTADO[filtros.estado] || filtros.estado}
              <button
                onClick={() => {
                  setFiltros((prev) => ({ ...prev, estado: "" }));
                  setPage(1);
                }}
                title="Quitar filtro"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 30, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#64748b"
              fontSize={13}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              width={130}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Bar
              dataKey="cantidad"
              radius={[0, 4, 4, 0]}
              barSize={24}
              onClick={handleBarClick}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={filtros.estado === entry.key ? "#1e293b" : "transparent"}
                  strokeWidth={filtros.estado === entry.key ? 2 : 0}
                  style={{
                    opacity: filtros.estado && filtros.estado !== entry.key ? 0.4 : 1,
                    transition: "all 0.2s ease"
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
