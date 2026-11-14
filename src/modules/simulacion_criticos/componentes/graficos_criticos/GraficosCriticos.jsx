import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FaChartColumn, FaChartLine, FaLayerGroup } from "react-icons/fa6";
import base from "../../../MotorDeteccion/deteccion_automatica/DeteccionAuth.module.css";
import { infoNivel } from "../../../../config/nivelesRiesgo";
import { histogramaScore, porTipo, serieRecall } from "../../simulacionCriticos";
import styles from "./GraficosCriticos.module.css";

const VERDE = "#059669";
const ROJO = infoNivel("critico").color;
const tooltipEstilo = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  boxShadow: "0 6px 24px #0f172a14",
  fontSize: 12,
};

function Tarjeta({ icono, titulo, descripcion, acciones, alto, children, className = "" }) {
  return (
    <article className={`${base.chartCard} ${className}`}>
      <div className={base.chartHeader}>
        <div className={base.chartHeading}>
          <span className={base.chartIcon} aria-hidden="true">
            {icono}
          </span>
          <div>
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
          </div>
        </div>
        {acciones}
      </div>
      <div className={styles.grafico} style={alto ? { height: alto } : undefined}>
        {children}
      </div>
    </article>
  );
}

// Etiqueta de una línea vertical de referencia, sobre el área del gráfico (no tapa las barras) y a un lado de la
// línea para que dos umbrales cercanos (0.725 y 0.75) no se encimen: `lado` = "izquierda" | "derecha".
function EtiquetaLinea({ viewBox, texto, color, lado }) {
  if (!viewBox) return null;
  const izquierda = lado === "izquierda";
  return (
    <text x={viewBox.x + (izquierda ? -5 : 5)} y={viewBox.y - 7} textAnchor={izquierda ? "end" : "start"} fill={color}
      fontSize={11} fontWeight={600} stroke="#fff" strokeWidth={3} paintOrder="stroke">
      {texto}
    </text>
  );
}

const ALCANCES = [
  { id: "comportamiento", etiqueta: "Comportamiento" },
  { id: "todos", etiqueta: "Todos" },
];

function Vacio() {
  return (
    <div className={base.chartEmpty}>
      <span>
        <FaChartLine />
      </span>
      <strong>Inicia la simulación para ver el gráfico</strong>
    </div>
  );
}

/**
 * Tres lecturas de los eventos ya procesados: cómo evoluciona el Recall hasta su valor final, qué tipos de
 * anomalía se escapan y dónde caen los scores de los omitidos respecto del umbral de decisión.
 */
export default function GraficosCriticos({ eventos, acumulado, indice, paquete }) {
  // Por defecto el histograma muestra solo los críticos de comportamiento: los de la política tienen el score
  // fijado en 0.90 y, al ser la gran mayoría, aplastan la escala y esconden a los omitidos.
  const [alcance, setAlcance] = useState("comportamiento");
  const procesados = useMemo(() => eventos.slice(0, indice), [eventos, indice]);
  const serie = useMemo(() => serieRecall(eventos, acumulado, indice), [eventos, acumulado, indice]);
  const tipos = useMemo(() => porTipo(procesados), [procesados]);
  const paraHistograma = useMemo(
    () => (alcance === "todos" ? procesados : procesados.filter((e) => !e.politica)),
    [procesados, alcance],
  );
  const histograma = useMemo(() => histogramaScore(paraHistograma), [paraHistograma]);
  const recallFinal = paquete.recall != null ? paquete.recall * 100 : null;
  const intervalo = paquete.intervalo;
  // Eje Y ajustado a los datos para que la diferencia entre 95 % y 100 % se vea, con marcas cada 5 puntos.
  const minimo = serie.length ? Math.max(0, Math.floor(Math.min(...serie.map((p) => p.recall)) / 5) * 5 - 5) : 0;
  const marcasRecall = Array.from({ length: (100 - minimo) / 5 + 1 }, (_, i) => minimo + i * 5);

  return (
    <div className={styles.contenedor}>
      <Tarjeta
        icono={<FaChartLine />}
        titulo="Recall acumulado en eventos críticos"
        descripcion={`Porcentaje detectado tras cada evento. La línea punteada marca el resultado final (${recallFinal?.toFixed(2) ?? "—"} %) y la franja, su intervalo de confianza al 95 %.`}
        className={styles.ancho}
      >
        {serie.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9eef5" />
              <XAxis
                dataKey="orden"
                type="number"
                domain={[1, paquete.total]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                domain={[minimo, 100]}
                ticks={marcasRecall}
                tickFormatter={(v) => `${v} %`}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={52}
              />
              {intervalo && (
                <ReferenceArea
                  y1={intervalo.inferior * 100}
                  y2={intervalo.superior * 100}
                  fill="#7c3aed"
                  fillOpacity={0.08}
                  ifOverflow="extendDomain"
                />
              )}
              {recallFinal != null && (
                <ReferenceLine y={recallFinal} stroke="#7c3aed" strokeDasharray="6 4" ifOverflow="extendDomain" />
              )}
              <Tooltip
                contentStyle={tooltipEstilo}
                labelFormatter={(orden) => `Evento crítico ${orden} de ${paquete.total}`}
                formatter={(valor) => [`${Number(valor).toFixed(2)} %`, "Recall acumulado"]}
              />
              <Line type="monotone" dataKey="recall" stroke="#7c3aed" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Vacio />
        )}
      </Tarjeta>

      <Tarjeta
        icono={<FaLayerGroup />}
        titulo="Detección por tipo de anomalía"
        descripcion="Eventos críticos procesados de cada tipo: detectados y omitidos."
        alto={Math.max(280, tipos.length * 34 + 70)}
      >
        {procesados.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tipos} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke="#e9eef5" />
              <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="etiqueta"
                width={160}
                interval={0}
                tick={{ fill: "#475569", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipEstilo} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="detectados" name="Detectados" stackId="t" fill={VERDE} isAnimationActive={false} />
              <Bar dataKey="omitidos" name="Omitidos" stackId="t" fill={ROJO} radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Vacio />
        )}
      </Tarjeta>

      <Tarjeta
        icono={<FaChartColumn />}
        titulo="Distribución del score final"
        descripcion={`Bajo el umbral (${Number(paquete.umbral).toFixed(3)}) el evento queda omitido; desde ${Number(paquete.umbral_bloqueo).toFixed(2)} la cuenta se bloquea.${alcance === "comportamiento" ? " Sin los de política, que tienen score fijo de 0.90." : ""}`}
        acciones={
          <div className={base.rangeControl} role="group" aria-label="Eventos incluidos en el histograma">
            {ALCANCES.map((a) => (
              <button
                key={a.id}
                type="button"
                aria-pressed={alcance === a.id}
                className={`${styles.alcanceBoton} ${alcance === a.id ? base.rangeActive : ""}`}
                onClick={() => setAlcance(a.id)}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>
        }
      >
        {paraHistograma.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histograma} margin={{ top: 24, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} stroke="#e9eef5" />
              <XAxis
                dataKey="centro"
                type="number"
                domain={[0, 1]}
                ticks={[0, 0.25, 0.5, 0.75, 1]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip
                contentStyle={tooltipEstilo}
                labelFormatter={(_, carga) => `Score ${carga?.[0]?.payload?.etiqueta ?? ""}`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine x={Number(paquete.umbral)} stroke="#7c3aed" strokeDasharray="6 4"
                label={<EtiquetaLinea texto="Umbral" color="#6d28d9" lado="izquierda" />} />
              <ReferenceLine x={Number(paquete.umbral_bloqueo)} stroke={ROJO} strokeDasharray="6 4"
                label={<EtiquetaLinea texto="Bloqueo" color={ROJO} lado="derecha" />} />
              <Bar dataKey="detectados" name="Detectados" stackId="s" fill={VERDE} barSize={14} isAnimationActive={false} />
              <Bar dataKey="omitidos" name="Omitidos" stackId="s" fill={ROJO} barSize={14} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Vacio />
        )}
      </Tarjeta>
    </div>
  );
}
