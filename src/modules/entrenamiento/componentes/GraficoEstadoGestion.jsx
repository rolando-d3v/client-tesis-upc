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
  LabelList,
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

const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const pct = total > 0 ? Math.round((data.cantidad / total) * 100) : 0;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipHeader} style={{ color: data.color }}>
          <div className={styles.tooltipHeaderLeft}>
            <span
              className={styles.tooltipDot}
              style={{ backgroundColor: data.color }}
            />
            {data.name}
          </div>
          <span
            className={styles.tooltipBadge}
            style={{ backgroundColor: `${data.color}15`, color: data.color }}
          >
            {pct}%
          </span>
        </div>
        <div className={styles.tooltipBody}>
          <div className={styles.tooltipStat}>
            <span className={styles.tooltipLabel}>Total incidentes:</span>
            <span className={styles.tooltipValue}>{data.cantidad}</span>
          </div>
          <p className={styles.tooltipDesc}>{data.descripcion}</p>
          <div className={styles.tooltipHint}>Clic para filtrar tabla por este estado</div>
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
  tiempoReal = false,
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

  const totalIncidentes = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [chartData]);

  const handleBarClick = (data) => {
    if (!data || !data.key) return;

    if (filtros?.estado === data.key) {
      setFiltros((prev) => ({ ...prev, estado: "" }));
    } else {
      setFiltros((prev) => ({ ...prev, estado: data.key, nivel_riesgo: "" }));
    }
    if (setPage) setPage(1);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.headerTitleRow}>
            <span className={styles.iconBadge}>
              <FaShieldHalved />
            </span>
            <h3 className={styles.title}>Estado de Gestión de Incidentes</h3>
          </div>
          <p className={styles.subtitle}>
            Ciclo de vida y respuesta de incidentes en el SOC
          </p>
        </div>

        <div className={styles.controlsGroup}>
          <select
            className={styles.monthSelect}
            value={filtros?.mes || ""}
            onChange={(e) => {
              setFiltros((prev) => ({ ...prev, mes: e.target.value }));
              if (setPage) setPage(1);
            }}
            title="Filtrar incidentes por mes"
          >
            <option value="">Todo el año</option>
            {resumen?.evolucion_mensual
              ?.filter((m) => m.total > 0)
              .map((m) => (
                <option key={m.key} value={m.key}>
                  {m.mes_completo || m.key}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 35, left: 15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#475569"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              width={125}
            />
            <Tooltip
              content={<CustomTooltip total={totalIncidentes} />}
              cursor={{ fill: "#f8fafc" }}
            />
            <Bar
              dataKey="cantidad"
              isAnimationActive={!tiempoReal}
              radius={[0, 6, 6, 0]}
              barSize={20}
              onClick={handleBarClick}
              cursor="pointer"
            >
              <LabelList
                dataKey="cantidad"
                position="right"
                fill="#334155"
                fontSize={12}
                fontWeight={700}
                offset={8}
                formatter={(val) => (val > 0 ? val : "")}
              />
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={filtros?.estado === entry.key ? "#0f172a" : "transparent"}
                  strokeWidth={filtros?.estado === entry.key ? 2 : 0}
                  style={{
                    opacity: filtros?.estado && filtros.estado !== entry.key ? 0.35 : 1,
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer consistente con GraficoTipoEvento */}
      <div className={styles.cardFooter}>
        <div className={styles.footerInfo}>
          <span>
            Total: <strong>{totalIncidentes.toLocaleString()}</strong> incidentes
          </span>
        </div>

        <div className={styles.footerFilters}>
          {filtros?.estado && (
            <span className={styles.filterBadgeActive}>
              Filtro: {NOMBRES_ESTADO[filtros.estado] || filtros.estado}
              <button
                type="button"
                className={styles.btnClearFilter}
                onClick={() => {
                  setFiltros((prev) => ({ ...prev, estado: "" }));
                  if (setPage) setPage(1);
                }}
                title="Quitar filtro de estado"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
