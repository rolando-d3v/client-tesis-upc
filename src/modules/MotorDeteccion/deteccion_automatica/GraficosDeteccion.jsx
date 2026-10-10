import { useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FaChartLine, FaLayerGroup, FaArrowRight, FaWaveSquare } from "react-icons/fa6";
import styles from "./DeteccionAuth.module.css";

const RIESGOS = [
  { id: "critico", label: "Crítico", color: "#dc2626", fondo: "#fef2f2" },
  { id: "alto", label: "Alto", color: "#c2410c", fondo: "#fff7ed" },
  { id: "medio", label: "Medio", color: "#a16207", fondo: "#fefce8" },
  { id: "bajo", label: "Bajo", color: "#047857", fondo: "#ecfdf5" },
];
const formatoScore = (score) => score.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TooltipScore({ active, payload }) {
  if (!active || !payload?.length) return null;
  const punto = payload[0].payload;
  return (
    <div className={styles.chartTooltip}>
      <span className={styles.tooltipLabel}>{punto.etiqueta}</span>
      <strong>{formatoScore(punto.score)} <small>/ 1</small></strong>
      <span>{punto.usuario}</span>
      {punto.fecha && <span className={styles.tooltipDate}>{punto.fecha}</span>}
    </div>
  );
}

export default function GraficosDeteccion({ eventos = [], filtros = {}, setFiltros, umbralAnomalia = 0.25 }) {
  const [ventana, setVentana] = useState(50);
  const gradientId = useId().replace(/:/g, "");
  const puntos = useMemo(() => eventos.slice(0, ventana).reverse().map((evento, indice) => {
    const score = evento.score_final == null || evento.score_final === "" ? NaN : Number(evento.score_final);
    return {
      orden: indice + 1,
      etiqueta: evento.id_evento != null ? `Evento #${evento.id_evento}` : `Detección ${indice + 1}`,
      score: Number.isFinite(score) ? Math.min(1, Math.max(0, score)) : null,
      usuario: evento.name_user || "Usuario sin identificar",
      fecha: evento.fecha_evento,
    };
  }), [eventos, ventana]);
  const puntuados = puntos.filter((punto) => punto.score !== null);
  const ultimoScore = puntos.at(-1)?.score;
  const promedio = puntuados.length ? puntuados.reduce((sum, punto) => sum + punto.score, 0) / puntuados.length : null;
  const distribucion = useMemo(() => RIESGOS.map((riesgo) => ({
    ...riesgo,
    cantidad: eventos.filter((evento) => String(evento.nivel_riesgo || "").toLowerCase() === riesgo.id).length,
  })), [eventos]);
  const clasificados = distribucion.reduce((sum, riesgo) => sum + riesgo.cantidad, 0);
  const riesgoActivo = filtros.nivel_riesgo || "";

  const filtrarRiesgo = (id) => {
    if (setFiltros) setFiltros((prev) => ({ ...prev, nivel_riesgo: prev.nivel_riesgo === id ? "" : id }));
  };

  return (
    <div className={styles.chartsGrid}>
      <section className={styles.chartCard} aria-labelledby={`${gradientId}-title`}>
        <div className={styles.chartHeader}>
          <div className={styles.chartHeading}>
            <span className={styles.chartIcon}><FaChartLine aria-hidden="true" /></span>
            <div>
              <h3 id={`${gradientId}-title`}>Evolución del score</h3>
              <p>Score combinado IF 40% + LSTM 60% · orden de recepción</p>
            </div>
          </div>
          <div className={styles.rangeControl} role="group" aria-label="Cantidad de eventos en el gráfico">
            {[20, 50, 100].map((cantidad) => (
              <button key={cantidad} type="button" aria-pressed={ventana === cantidad}
                className={ventana === cantidad ? styles.rangeActive : ""} onClick={() => setVentana(cantidad)}>
                {cantidad}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.scoreSummary}>
          <div><span className={styles.metricLabel}>Último score</span>
            <strong>{ultimoScore != null ? formatoScore(ultimoScore) : "—"}<small> / 1</small></strong>
          </div>
          <div className={styles.averageScore}><span className={styles.metricLabel}>Promedio del período</span>
            <strong>{promedio !== null ? formatoScore(promedio) : "—"}</strong>
          </div>
          <span className={styles.windowBadge}>{puntos.length} eventos</span>
        </div>

        <div className={styles.scoreChart}>
          {puntuados.length ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 1, height: 216 }}>
              <AreaChart data={puntos} margin={{ top: 12, right: 12, bottom: 4, left: -18 }} accessibilityLayer>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e8edf3" strokeDasharray="3 4" />
                <XAxis dataKey="orden" axisLine={false} tickLine={false} minTickGap={28}
                  tick={{ fill: "#64748b", fontSize: 11 }} tickMargin={12} />
                <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} axisLine={false} tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(valor) => formatoScore(valor)} />
                <ReferenceLine y={0.25} stroke="#a16207" strokeDasharray="5 5" strokeOpacity={0.6} />
                <ReferenceLine y={0.5} stroke="#d97706" strokeDasharray="5 5" strokeOpacity={0.6} />
                <ReferenceLine y={0.75} stroke="#dc2626" strokeDasharray="5 5" strokeOpacity={0.6} />
                <ReferenceLine y={umbralAnomalia} stroke="#7c3aed" strokeWidth={2} label="Umbral de anomalía" />
                <Tooltip content={<TooltipScore />} cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3" }} />
                <Area type="linear" dataKey="score" name="Score de riesgo" stroke="#2563eb" strokeWidth={2.5}
                  fill={`url(#${gradientId})`} isAnimationActive={false}
                  dot={puntuados.length === 1 ? { r: 4, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 } : false}
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.chartEmpty}>
              <span><FaWaveSquare aria-hidden="true" /></span>
              <strong>Esperando la primera detección</strong>
              <p>Inicia la simulación para ver cómo evoluciona el riesgo.</p>
            </div>
          )}
        </div>
        <div className={styles.chartFooter}>
          <span><i className={styles.legendBlue} />Score combinado · anomalía ≥ {formatoScore(umbralAnomalia)}</span>
          <span><i className={styles.legendAmber} />Alto ≥ {formatoScore(0.5)}</span>
          <span><i className={styles.legendRed} />Crítico ≥ {formatoScore(0.75)}</span>
        </div>
      </section>

      <section className={styles.chartCard} aria-labelledby={`${gradientId}-risk-title`}>
        <div className={styles.chartHeader}>
          <div className={styles.chartHeading}>
            <span className={styles.chartIcon}><FaLayerGroup aria-hidden="true" /></span>
            <div>
              <h3 id={`${gradientId}-risk-title`}>Distribución de riesgos</h3>
              <p>Sobre {clasificados} eventos clasificados del feed</p>
            </div>
          </div>
        <div className={styles.riskSummary}>
          <strong>{distribucion[0].cantidad + distribucion[1].cantidad}</strong>
          <div><span>con riesgo alto o crítico</span><small>Prioridad de revisión</small></div>
        </div>
        </div>
        <div className={styles.riskList} aria-label="Filtrar el registro por nivel de riesgo">
          {distribucion.map((riesgo) => {
            const porcentaje = clasificados ? riesgo.cantidad / clasificados * 100 : 0;
            const activo = riesgoActivo === riesgo.id;
            return (
              <button key={riesgo.id} type="button" className={`${styles.riskRow} ${activo ? styles.riskRowActive : ""}`}
                aria-pressed={activo} disabled={!setFiltros || !clasificados}
                aria-label={`${riesgo.label}: ${riesgo.cantidad} eventos, ${porcentaje.toFixed(0)} por ciento. ${activo ? "Quitar" : "Aplicar"} filtro`}
                onClick={() => filtrarRiesgo(riesgo.id)} style={{ "--risk-color": riesgo.color, "--risk-bg": riesgo.fondo }}>
                <span className={styles.riskRowTop}><span className={styles.riskName}><i />{riesgo.label}</span>
                  <span className={styles.riskValues}><strong>{riesgo.cantidad}</strong><small>{porcentaje.toFixed(0)}%</small></span>
                </span>
                <span className={styles.riskTrack}><span style={{ width: `${porcentaje}%` }} /></span>
              </button>
            );
          })}
        </div>
        <div className={styles.riskFooter}>
          {riesgoActivo && setFiltros ? (
            <button type="button" className={styles.clearFilter} onClick={() => setFiltros((prev) => ({ ...prev, nivel_riesgo: "" }))}>
              Quitar filtro de riesgo <span aria-hidden="true">×</span>
            </button>
          ) : (
            <span>{clasificados ? "Selecciona un nivel para filtrar el registro" : "Los niveles aparecerán al recibir eventos"}<FaArrowRight aria-hidden="true" /></span>
          )}
        </div>
      </section>
    </div>
  );
}
