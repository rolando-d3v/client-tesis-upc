import { useState, useMemo } from "react";
import styles from "./GraficoEvolucionRiesgos.module.css";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { FaWaveSquare } from "react-icons/fa6";
import { toast } from "sonner";

const MESES_ABREV = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

// Configuración de niveles de riesgo, colores exactos a la imagen de referencia
const CONFIG_RIESGO = {
  critico: {
    nombre: "Crítico",
    colorStroke: "#ef4444",
    dotClass: styles.dotCritico,
    gradientId: "colorCritico",
  },
  alto: {
    nombre: "Alto",
    colorStroke: "#f59e0b",
    dotClass: styles.dotAlto,
    gradientId: "colorAlto",
  },
  medio: {
    nombre: "Medio",
    colorStroke: "#0ea5e9",
    dotClass: styles.dotMedio,
    gradientId: "colorMedio",
  },
  bajo: {
    nombre: "Bajo",
    colorStroke: "#10b981",
    dotClass: styles.dotBajo,
    gradientId: "colorBajo",
  },
};

// Tooltip personalizado con diseño glassmorphism oscuro
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  // Calculamos el total de amenazas en este punto
  const totalPunto = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

  return (
    <div className={styles.customTooltip}>
      <div className={styles.tooltipHeader}>
        <span className={styles.tooltipTitle}>{payload[0]?.payload?.mesCompleto || label}</span>
        <span className={styles.tooltipTotal}>{totalPunto} total</span>
      </div>

      {payload
        .slice()
        .reverse()
        .map((entry) => {
          const key = entry.dataKey;
          const conf = CONFIG_RIESGO[key] || {};
          const val = Number(entry.value || 0);
          const pct = totalPunto > 0 ? ((val / totalPunto) * 100).toFixed(0) : 0;

          return (
            <div key={key} className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>
                <span
                  className={styles.dot}
                  style={{
                    backgroundColor: conf.colorStroke || entry.color,
                    boxShadow: `0 0 6px ${conf.colorStroke || entry.color}`,
                  }}
                />
                {conf.nombre || entry.name}
              </span>
              <span className={styles.tooltipVal}>
                {val.toLocaleString()} <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>({pct}%)</span>
              </span>
            </div>
          );
        })}
    </div>
  );
}

export default function GraficoEvolucionRiesgos({
  resumen,
  filtros = {},
  setFiltros,
  setPage,
  tiempoReal = false,
}) {
  const [granularidad, setGranularidad] = useState("mensual"); // "mensual" | "diario"

  const { evolucion_mensual = [], evolucion_diaria = [] } = resumen || {};

  // Selección de datos según granularidad
  const chartData = useMemo(() => {
    if (granularidad === "mensual") {
      // En vivo, con un solo mes con datos, un área de 1 punto no dibuja nada:
      // se completa el año con ceros para que la curva se vea y crezca.
      if (tiempoReal && evolucion_mensual && evolucion_mensual.length === 1) {
        const unico = evolucion_mensual[0];
        const anio = String(unico.key || "").slice(0, 4);
        return MESES_ABREV.map((label, i) => {
          const esMes = unico.key
            ? String(unico.key).endsWith(`-${String(i + 1).padStart(2, "0")}`)
            : (unico.label || unico.mes) === label;
          return esMes
            ? { ...unico, label, mesCompleto: unico.mes_completo || `${label} ${anio}`.trim() }
            : { label, mesCompleto: `${label} ${anio}`.trim(), critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 };
        });
      }
      if (evolucion_mensual && evolucion_mensual.length > 0) {
        return evolucion_mensual.map((item) => ({
          ...item,
          label: (item.label || item.mes || "").split(" ")[0],
          mesCompleto: item.mes_completo || item.label || item.mes,
        }));
      }
      // Datos de respaldo predeterminados por mes (vacíos)
      return [
        { label: "Ene", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Feb", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Mar", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Abr", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "May", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Jun", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Jul", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Ago", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Set", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Oct", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Nov", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
        { label: "Dic", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
      ];
    } else {
      if (evolucion_diaria && evolucion_diaria.length > 0) {
        return evolucion_diaria;
      }
      return [];
    }
  }, [granularidad, tiempoReal, evolucion_mensual, evolucion_diaria]);

  // Con 1-2 puntos (p. ej. "Por Día" al arrancar la simulación) se muestran los puntos
  // para que el primer evento ya se vea en el gráfico.
  const mostrarPuntos = chartData.length <= 2;
  const puntoProps = mostrarPuntos ? { r: 4, strokeWidth: 2, fill: "#0b1220" } : false;

  const activeRisk = (filtros.nivel_riesgo || "").toLowerCase();

  // Manejo de filtro cruzado interactivo al hacer clic en un nivel de riesgo
  const handleToggleFiltroRiesgo = (nivelKey) => {
    if (!setFiltros) return;

    if (!nivelKey || activeRisk === nivelKey) {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "" }));
      if (setPage) setPage(1);
      toast.info("Mostrando todos los niveles de riesgo");
    } else {
      // Al filtrar por riesgo específico, limpiamos estado para evitar incompatibilidad
      // (ej: Crítico está contenido, Alto está abierto en la base de datos)
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: nivelKey,
        estado: "",
      }));
      if (setPage) setPage(1);
      toast.success(`Filtrando incidentes: Nivel ${CONFIG_RIESGO[nivelKey]?.nombre || nivelKey}`);
    }
  };

  // Cálculo de totales rápidos del período
  const totalPeriodo = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + (curr.total || 0), 0);
  }, [chartData]);

  return (
    <div className={styles.container}>
      {/* Cabecera del gráfico */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <FaWaveSquare style={{ color: "#38bdf8", fontSize: "1.1rem" }} />
          <h2 className={styles.title}>Evolución de Riesgos Detectados</h2>
          {activeRisk ? (
            <span
              className={styles.badgeFiltro}
              style={{
                backgroundColor: `${CONFIG_RIESGO[activeRisk]?.colorStroke}20`,
                color: CONFIG_RIESGO[activeRisk]?.colorStroke,
                borderColor: `${CONFIG_RIESGO[activeRisk]?.colorStroke}40`,
              }}
            >
              Filtro: {CONFIG_RIESGO[activeRisk]?.nombre}
            </span>
          ) : (
            <span className={styles.badgeLive}>Capas Apiladas</span>
          )}
        </div>

        <div className={styles.controlsArea}>
          {/* Leyenda interactiva con opción "Todos" y niveles individuales */}
          <div className={styles.legend}>
            <div
              className={`${styles.legendItem} ${!activeRisk ? styles.legendItemActive : ""}`}
              onClick={() => handleToggleFiltroRiesgo("")}
              title="Mostrar todas las capas de riesgo apiladas"
            >
              <span className={styles.dotAll} />
              <span>Todos</span>
            </div>

            {Object.entries(CONFIG_RIESGO).map(([key, conf]) => {
              const isSelected = activeRisk === key;
              return (
                <div
                  key={key}
                  className={`${styles.legendItem} ${isSelected ? styles.legendItemActive : ""}`}
                  onClick={() => handleToggleFiltroRiesgo(key)}
                  title={`Filtrar tabla y aislar curva de nivel ${conf.nombre}`}
                >
                  <span className={`${styles.dot} ${conf.dotClass}`} />
                  <span>{conf.nombre}</span>
                </div>
              );
            })}
          </div>

          {/* Selector de Granularidad: Mensual vs Diario */}
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${granularidad === "mensual" ? styles.toggleBtnActive : ""}`}
              onClick={() => setGranularidad("mensual")}
              title="Ver evolución mensual de riesgos"
            >
              Por Mes
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${granularidad === "diario" ? styles.toggleBtnActive : ""}`}
              onClick={() => setGranularidad("diario")}
              title="Ver evolución diaria (ondas temporales)"
            >
              Por Día
            </button>
          </div>
        </div>
      </div>

      {/* Lienzo del gráfico con curvas suaves y gradientes dinámicos */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <defs>
              {/* Gradiente Crítico (Rojo) */}
              <linearGradient id="colorCritico" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.65} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
              </linearGradient>

              {/* Gradiente Alto (Ámbar / Naranja) */}
              <linearGradient id="colorAlto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.55} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
              </linearGradient>

              {/* Gradiente Medio (Azul Eléctrico) */}
              <linearGradient id="colorMedio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.03} />
              </linearGradient>

              {/* Gradiente Bajo (Verde Esmeralda) */}
              <linearGradient id="colorBajo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.40} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.06)" />

            <XAxis
              dataKey="label"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              tickLine={false}
              interval={0}
              tickFormatter={(val) => (val ? String(val).split(" ")[0] : "")}
            />

            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Si no hay filtro o el filtro es "critico" */}
            {(!activeRisk || activeRisk === "critico") && (
              <Area
                type="monotone"
                dataKey="critico"
                isAnimationActive={tiempoReal ? false : "auto"}
                name="Crítico"
                stackId={activeRisk ? undefined : "1"}
                stroke="#ef4444"
                strokeWidth={activeRisk === "critico" ? 3 : 2.5}
                fill="url(#colorCritico)"
                dot={puntoProps}
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}

            {/* Si no hay filtro o el filtro es "alto" */}
            {(!activeRisk || activeRisk === "alto") && (
              <Area
                type="monotone"
                dataKey="alto"
                isAnimationActive={tiempoReal ? false : "auto"}
                name="Alto"
                stackId={activeRisk ? undefined : "1"}
                stroke="#f59e0b"
                strokeWidth={activeRisk === "alto" ? 3 : 2.5}
                fill="url(#colorAlto)"
                dot={puntoProps}
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}

            {/* Si no hay filtro o el filtro es "medio" */}
            {(!activeRisk || activeRisk === "medio") && (
              <Area
                type="monotone"
                dataKey="medio"
                isAnimationActive={tiempoReal ? false : "auto"}
                name="Medio"
                stackId={activeRisk ? undefined : "1"}
                stroke="#0ea5e9"
                strokeWidth={activeRisk === "medio" ? 3 : 2.5}
                fill="url(#colorMedio)"
                dot={puntoProps}
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}

            {/* Si no hay filtro o el filtro es "bajo" */}
            {(!activeRisk || activeRisk === "bajo") && (
              <Area
                type="monotone"
                dataKey="bajo"
                isAnimationActive={tiempoReal ? false : "auto"}
                name="Bajo"
                stackId={activeRisk ? undefined : "1"}
                stroke="#10b981"
                strokeWidth={activeRisk === "bajo" ? 3 : 2.5}
                fill="url(#colorBajo)"
                dot={puntoProps}
                activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Barra de pie: métricas de apoyo e indicación de filtro activo */}
      <div className={styles.footerBar}>
        <div className={styles.footerLeft}>
          <span className={styles.footerStat}>
            Total en horizonte: <strong>{totalPeriodo.toLocaleString()}</strong> amenazas
          </span>
          <span className={styles.footerStat}>
            Visualización activa: <strong>{granularidad === "mensual" ? "Consolidado Mensual" : "Ondas Diarias"}</strong>
          </span>
        </div>

        {filtros.nivel_riesgo && (
          <div className={styles.filterNotice}>
            <span>Filtro activo: {CONFIG_RIESGO[filtros.nivel_riesgo]?.nombre || filtros.nivel_riesgo}</span>
            <button
              type="button"
              className={styles.clearFilterBtn}
              onClick={() => handleToggleFiltroRiesgo(filtros.nivel_riesgo)}
            >
              (Limpiar)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
