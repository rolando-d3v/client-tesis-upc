import { useState, useMemo } from "react";
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
  { value: "Todos", label: "Todos" },
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

export function MbPorDia({ mbPorDia = [] }) {
  const [monthFilter, setMonthFilter] = useState("Todos");

  const filteredMbPorDia = useMemo(() => {
    if (!mbPorDia || !Array.isArray(mbPorDia)) return [];
    if (monthFilter === "Todos") return mbPorDia;

    return mbPorDia.filter((item) => {
      if (!item || !item.fecha) return false;
      let month = "";

      const fechaStr = String(item.fecha).trim();
      const parts = fechaStr.split(/[-/T ]/);

      if (parts.length >= 3) {
        if (parts[0].length === 4) {
          month = parts[1].padStart(2, "0");
        } else if (parts[2].length === 4) {
          month = parts[1].padStart(2, "0");
        }
      } else if (parts.length >= 2) {
        if (parts[0].length === 4) {
          month = parts[1].padStart(2, "0");
        } else if (parts[1].length === 4) {
          month = parts[0].padStart(2, "0");
        }
      }

      if (!month) {
        const d = new Date(fechaStr);
        if (!isNaN(d)) {
          month = String(d.getUTCMonth() + 1).padStart(2, "0");
        }
      }

      return month === monthFilter;
    });
  }, [mbPorDia, monthFilter]);

  if (!mbPorDia || mbPorDia.length === 0) {
    return <p className={styles.empty}>Sin datos de volumen diario</p>;
  }

  return (
    <div>
      <div className={styles.tabsContainer}>
        {MONTHS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMonthFilter(m.value)}
            className={`${styles.tabBtn} ${monthFilter === m.value ? styles.active : ""}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {filteredMbPorDia.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={filteredMbPorDia} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis
              dataKey="fecha"
              tickFormatter={(val) => {
                const d = new Date(val);
                if (!isNaN(d)) {
                  return new Intl.DateTimeFormat("es-ES", {
                    day: "2-digit",
                    month: "short",
                    timeZone: "UTC",
                  }).format(d);
                }
                return val;
              }}
              tick={{ fill: "#475569", fontSize: 10 }}
            />
            <YAxis tick={{ fill: "#475569", fontSize: 11 }} unit=" MB" />
            <Tooltip
              labelFormatter={(val) => {
                const d = new Date(val);
                if (!isNaN(d)) {
                  return new Intl.DateTimeFormat("es-ES", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(d);
                }
                return val;
              }}
              formatter={(val) => [`${Number(val).toFixed(1)} MB`, "Total"]}
              contentStyle={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#1e293b",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="total_mb"
              stroke="#c084fc"
              fill="url(#gradMB)"
              strokeWidth={2}
              name="Total MB"
            />
            <defs>
              <linearGradient id="gradMB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div
          style={{
            width: "100%",
            height: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontStyle: "italic",
          }}
        >
          No se encontraron transferencias para el mes seleccionado.
        </div>
      )}
    </div>
  );
}

export function MbPorOficina({ mbPorOficina = [] }) {
  if (!mbPorOficina || mbPorOficina.length === 0) {
    return <p className={styles.empty}>Sin datos de volumen por oficina</p>;
  }

  return (
    <div className={styles.scrollWrapper}>
      <ResponsiveContainer width="100%" height={Math.max(mbPorOficina.length * 36, 300)}>
        <BarChart data={mbPorOficina} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} />
          <YAxis
            dataKey="oficina"
            type="category"
            width={180}
            tick={{ fill: "#1e293b", fontSize: 10, fontWeight: 500 }}
            tickFormatter={(val) => (val && val.length > 24 ? `${val.substring(0, 22)}...` : val)}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)} MB`, "Volumen"]}
            contentStyle={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#1e293b",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar dataKey="total_mb" fill="#38bdf8" radius={[0, 6, 6, 0]} name="Total MB" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VolumenMB({ mbPorDia = [], mbPorOficina = [] }) {
  return (
    <div className={styles.container}>
      {mbPorDia.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.subtitle}>📈 MB Transferidos por Día</h4>
          <MbPorDia mbPorDia={mbPorDia} />
        </div>
      )}
      {mbPorOficina.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.subtitle}>🏢 MB por Oficina (Top 15)</h4>
          <MbPorOficina mbPorOficina={mbPorOficina} />
        </div>
      )}
    </div>
  );
}
