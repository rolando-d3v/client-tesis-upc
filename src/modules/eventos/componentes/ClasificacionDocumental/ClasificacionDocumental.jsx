import {
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import styles from "./ClasificacionDocumental.module.css";

const formatoNumero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const formatoVolumen = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

const formatoMbEje = (valor) => {
  const numero = Number(valor) || 0;
  return numero >= 1000 ? `${(numero / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })} mil` : formatoNumero.format(numero);
};

export function TablaClasificacion({ porClasificacion = [] }) {
  if (!porClasificacion || porClasificacion.length === 0) {
    return <p className={styles.empty}>Sin datos de clasificación</p>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Clasificación</th>
            <th scope="col" className={styles.textRight}>Eventos</th>
            <th scope="col" className={styles.textRight}>Descargas</th>
            <th scope="col" className={styles.textRight}>Volumen (MB)</th>
            <th scope="col" className={styles.textRight}>Fuera de horario</th>
          </tr>
        </thead>
        <tbody>
          {porClasificacion.map((c, i) => (
            <tr key={i}>
              <td>
                <span className={styles[`badge_${c.clasificacion?.toLowerCase()}`]}>
                  {c.clasificacion}
                </span>
              </td>
              <td className={styles.textRight}>{formatoNumero.format(Number(c.total_eventos) || 0)}</td>
              <td className={styles.textRight}>{formatoNumero.format(Number(c.n_descargas) || 0)}</td>
              <td className={styles.textRight}>{formatoVolumen.format(Number(c.total_mb) || 0)}</td>
              <td className={styles.textRight}>{formatoNumero.format(Number(c.n_fuera_horario) || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CruceClasificacionHorario({ cruce = [] }) {
  if (!cruce || cruce.length === 0) {
    return <p className={styles.empty}>Sin datos de cruce horario</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={cruce} margin={{ top: 8, right: 12, left: 4, bottom: 4 }} barGap={8}>
        <CartesianGrid vertical={false} stroke="#e9eef5" />
        <XAxis
          dataKey="clasificacion"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 11 }}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#64748b", fontSize: 10 }}
          tickFormatter={formatoMbEje}
          width={54}
        />
        <Tooltip
          formatter={(value) => [`${formatoVolumen.format(Number(value) || 0)} MB`]}
          labelFormatter={(label) => `Clasificación: ${label}`}
          contentStyle={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            color: "#1e293b",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={34}
          wrapperStyle={{ fontSize: 11, color: "#475569", paddingTop: 8 }}
        />
        <Bar
          dataKey="mb_en_horario"
          name="En horario"
          fill="#2563eb"
          radius={[4, 4, 0, 0]}
          maxBarSize={34}
        />
        <Bar
          dataKey="mb_fuera_horario"
          name="Fuera de horario"
          fill="#d97706"
          radius={[4, 4, 0, 0]}
          maxBarSize={34}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopTiposDocumento({ porTipoDocumento = [] }) {
  if (!porTipoDocumento || porTipoDocumento.length === 0) {
    return <p className={styles.empty}>Sin datos de tipos de documento</p>;
  }

  return (
    <div className={styles.scrollWrapper}>
      <ResponsiveContainer width="100%" height={Math.max(porTipoDocumento.length * 34, 270)}>
        <BarChart data={porTipoDocumento} layout="vertical" margin={{ top: 6, right: 20, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="#e9eef5" />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 10 }}
            tickFormatter={formatoNumero.format}
          />
          <YAxis
            dataKey="NAME_TIPO_DOCUMENTO"
            type="category"
            width={132}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickFormatter={(val) => (val && val.length > 22 ? `${val.substring(0, 20)}…` : val)}
          />
          <Tooltip
            formatter={(value) => [formatoNumero.format(Number(value) || 0), "Eventos"]}
            contentStyle={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#1e293b",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar dataKey="total_eventos" fill="#4f46e5" radius={[0, 5, 5, 0]} name="Eventos" maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ClasificacionDocumental({ porClasificacion = [], cruce = [], porTipoDocumento = [] }) {
  return (
    <div className={styles.container}>
      <div className={styles.sectionFull}>
        <h4 className={styles.subtitle}>📋 Detalle por Clasificación</h4>
        <TablaClasificacion porClasificacion={porClasificacion} />
      </div>

      {cruce.length > 0 && (
        <div className={styles.sectionFull}>
          <h4 className={styles.subtitle}>🔗 Cruce: Clasificación × Horario</h4>
          <CruceClasificacionHorario cruce={cruce} />
        </div>
      )}

      {porTipoDocumento.length > 0 && (
        <div className={styles.sectionFull}>
          <h4 className={styles.subtitle}>📄 Top Tipos de Documento</h4>
          <TopTiposDocumento porTipoDocumento={porTipoDocumento} />
        </div>
      )}
    </div>
  );
}
