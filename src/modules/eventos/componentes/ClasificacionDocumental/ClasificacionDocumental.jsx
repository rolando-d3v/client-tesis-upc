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

export function TablaClasificacion({ porClasificacion = [] }) {
  if (!porClasificacion || porClasificacion.length === 0) {
    return <p className={styles.empty}>Sin datos de clasificación</p>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Clasificación</th>
            <th className={styles.textRight}>Eventos</th>
            <th className={styles.textRight}>Descargas</th>
            <th className={styles.textRight}>Total MB</th>
            <th className={styles.textRight}>Fuera Horario</th>
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
              <td className={styles.textRight}>{c.total_eventos?.toLocaleString()}</td>
              <td className={styles.textRight}>{c.n_descargas?.toLocaleString()}</td>
              <td className={styles.textRight}>{c.total_mb?.toFixed(1)} MB</td>
              <td className={styles.textRight}>{c.n_fuera_horario?.toLocaleString()}</td>
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
      <BarChart data={cruce} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="clasificacion" tick={{ fill: "#475569", fontSize: 11 }} />
        <YAxis tick={{ fill: "#475569", fontSize: 11 }} unit=" MB" />
        <Tooltip
          formatter={(value) => [`${Number(value).toFixed(1)} MB`]}
          contentStyle={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            color: "#1e293b",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#475569", paddingTop: 8 }} />
        <Bar dataKey="mb_fuera_horario" name="MB Fuera Horario" fill="#f97316" radius={[4, 4, 0, 0]} />
        <Bar dataKey="mb_en_horario" name="MB En Horario" fill="#818cf8" radius={[4, 4, 0, 0]} />
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
      <ResponsiveContainer width="100%" height={Math.max(porTipoDocumento.length * 36, 280)}>
        <BarChart data={porTipoDocumento} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} />
          <YAxis
            dataKey="NAME_TIPO_DOCUMENTO"
            type="category"
            width={140}
            tick={{ fill: "#1e293b", fontSize: 10, fontWeight: 500 }}
            tickFormatter={(val) => (val && val.length > 20 ? `${val.substring(0, 18)}...` : val)}
          />
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString(), "Eventos"]}
            contentStyle={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              color: "#1e293b",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar dataKey="total_eventos" fill="#c084fc" radius={[0, 6, 6, 0]} name="Eventos" />
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
