import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import styles from "./VolumenMB.module.css";

const MONTHS = [
  { value: "Todos", label: "Todos los meses" },
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const formatoNumero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const formatoVolumen = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

function obtenerMes(fecha) {
  if (!fecha) return "";
  const partes = String(fecha).trim().split(/[-/T ]/);

  if (partes[0]?.length === 4 && partes[1]) return partes[1].padStart(2, "0");
  if (partes[2]?.length === 4 && partes[1]) return partes[1].padStart(2, "0");

  const fechaParseada = new Date(fecha);
  return Number.isNaN(fechaParseada.getTime())
    ? ""
    : String(fechaParseada.getUTCMonth() + 1).padStart(2, "0");
}

function formatearFecha(fecha, opciones) {
  const fechaParseada = new Date(fecha);
  if (Number.isNaN(fechaParseada.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-PE", { ...opciones, timeZone: "UTC" }).format(fechaParseada);
}

function formatearEjeMb(valor) {
  const numero = Number(valor) || 0;
  return numero >= 1000
    ? `${(numero / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })} mil`
    : formatoNumero.format(numero);
}

const estiloTooltip = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  color: "#1e293b",
  boxShadow: "0 8px 20px rgb(15 23 42 / 10%)",
  fontSize: 12,
};

export function MbPorDia({ mbPorDia = [] }) {
  const [monthFilter, setMonthFilter] = useState("Todos");

  const filteredMbPorDia = useMemo(() => {
    if (!Array.isArray(mbPorDia)) return [];
    if (monthFilter === "Todos") return mbPorDia;
    return mbPorDia.filter((item) => obtenerMes(item?.fecha) === monthFilter);
  }, [mbPorDia, monthFilter]);

  const totalFiltrado = filteredMbPorDia.reduce((total, item) => total + (Number(item.total_mb) || 0), 0);
  const mesSeleccionado = MONTHS.find((month) => month.value === monthFilter)?.label.toLowerCase();

  if (!mbPorDia || mbPorDia.length === 0) {
    return <p className={styles.empty}>No hay registros de volumen diario para este periodo.</p>;
  }

  return (
    <div className={styles.dailyChart}>
      <div className={styles.chartControls}>
        <label className={styles.filter}>
          <span>Periodo</span>
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            aria-label="Filtrar el volumen diario por mes"
          >
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.chartSummary} aria-live="polite">
          {filteredMbPorDia.length} {filteredMbPorDia.length === 1 ? "día" : "días"}
          {monthFilter !== "Todos" && ` · ${mesSeleccionado}`}
          <span>{formatoVolumen.format(totalFiltrado)} MB</span>
        </span>
      </div>

      {filteredMbPorDia.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={filteredMbPorDia} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid vertical={false} stroke="#e9eef5" />
            <XAxis
              dataKey="fecha"
              interval="preserveStartEnd"
              minTickGap={28}
              tickFormatter={(value) =>
                formatearFecha(value, { day: "2-digit", month: "short" })
              }
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              tickFormatter={formatearEjeMb}
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              labelFormatter={(value) =>
                formatearFecha(value, {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              }
              formatter={(value) => [`${formatoVolumen.format(Number(value) || 0)} MB`, "Volumen"]}
              contentStyle={estiloTooltip}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={28}
              wrapperStyle={{ fontSize: 11, color: "#475569" }}
            />
            <defs>
              <linearGradient id="gradMB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.015} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="total_mb"
              name="Volumen transferido"
              stroke="#2563eb"
              fill="url(#gradMB)"
              strokeWidth={2.5}
              activeDot={{ r: 4, strokeWidth: 0 }}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className={styles.noResults} role="status">
          No se encontraron transferencias para {mesSeleccionado}.
        </div>
      )}
    </div>
  );
}

export function MbPorOficina({ mbPorOficina = [] }) {
  if (!mbPorOficina || mbPorOficina.length === 0) {
    return <p className={styles.empty}>No hay datos de volumen por oficina para mostrar.</p>;
  }

  return (
    <div className={styles.officeScroll} role="region" aria-label="Volumen transferido por oficina">
      <ResponsiveContainer width="100%" height={Math.max(mbPorOficina.length * 34, 280)}>
        <BarChart
          data={mbPorOficina}
          layout="vertical"
          margin={{ top: 6, right: 18, left: 4, bottom: 4 }}
          barCategoryGap={8}
        >
          <CartesianGrid horizontal={false} stroke="#e9eef5" />
          <XAxis
            type="number"
            tickFormatter={formatearEjeMb}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            dataKey="oficina"
            type="category"
            width={140}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => (value && value.length > 24 ? `${value.substring(0, 22)}…` : value)}
          />
          <Tooltip
            labelFormatter={(label) => `Oficina: ${label}`}
            formatter={(value) => [`${formatoVolumen.format(Number(value) || 0)} MB`, "Volumen"]}
            contentStyle={estiloTooltip}
          />
          <Bar
            dataKey="total_mb"
            fill="#2563eb"
            radius={[0, 5, 5, 0]}
            name="Volumen transferido"
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VolumenMB({ mbPorDia = [], mbPorOficina = [] }) {
  return (
    <div className={styles.container}>
      {mbPorDia.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.subtitle}>Volumen transferido por día</h4>
          <MbPorDia mbPorDia={mbPorDia} />
        </section>
      )}
      {mbPorOficina.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.subtitle}>Volumen por oficina (Top 15)</h4>
          <MbPorOficina mbPorOficina={mbPorOficina} />
        </section>
      )}
    </div>
  );
}
