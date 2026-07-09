import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState, useMemo } from "react";
import styles from "./PerfilUsuarioEWMA.module.css";

const COLORES = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#38bdf8", "#c084fc", "#818cf8", "#f472b6"];

export default function PerfilUsuarioEWMA({ perfiles = [], ewmaTemporal = [] }) {
  const [selectedUsers, setSelectedUsers] = useState([]);

  const topUsers = useMemo(() =>
    perfiles.slice(0, 10).map(p => ({ user_id: p.user_id, nombre: p.nombre })),
    [perfiles]
  );

  const toggleUser = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId].slice(-5));
  };

  const chartData = useMemo(() => {
    if (selectedUsers.length === 0 || ewmaTemporal.length === 0) return [];
    const fechas = [...new Set(ewmaTemporal.filter(e => selectedUsers.includes(e.user_id)).map(e => e.fecha))].sort();
    return fechas.map(fecha => {
      const item = { fecha };
      selectedUsers.forEach(uid => {
        const entry = ewmaTemporal.find(e => e.user_id === uid && e.fecha === fecha);
        const nombre = topUsers.find(u => u.user_id === uid)?.nombre || uid;
        item[nombre] = entry?.ewma || 0;
      });
      return item;
    });
  }, [selectedUsers, ewmaTemporal, topUsers]);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h4 className={styles.subtitle}>📊 Perfiles de Usuario — Score EWMA</h4>
        <div className={styles.userSelector}>
          {topUsers.map((u, idx) => (
            <button key={u.user_id} className={`${styles.userBtn} ${selectedUsers.includes(u.user_id) ? styles.active : ""}`}
              style={selectedUsers.includes(u.user_id) ? { borderColor: COLORES[selectedUsers.indexOf(u.user_id) % COLORES.length] } : {}}
              onClick={() => toggleUser(u.user_id)}>
              {u.nombre?.split(" ")[0]}
            </button>
          ))}
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="fecha" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {selectedUsers.map((uid, idx) => {
                const nombre = topUsers.find(u => u.user_id === uid)?.nombre || uid;
                return <Line key={uid} type="monotone" dataKey={nombre} stroke={COLORES[idx % COLORES.length]} strokeWidth={2} dot={false} />;
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : <p className={styles.hint}>Selecciona usuarios para ver su evolución EWMA</p>}
      </div>

      <div className={styles.section}>
        <h4 className={styles.subtitle}>📋 Tabla de Perfiles</h4>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr>
              <th>Nivel</th><th>Usuario</th><th>Oficina</th><th>Eventos</th>
              <th>Media Ev/Hr</th><th>Std</th><th>Media MB/Día</th><th>% Secreto</th><th>EWMA</th><th>Score</th>
            </tr></thead>
            <tbody>
              {perfiles.map((p, i) => (
                <tr key={i}>
                  <td>{p.nivel_riesgo === "critico" ? "🔴" : p.nivel_riesgo === "alto" ? "🟠" : p.nivel_riesgo === "medio" ? "🟡" : "🟢"}</td>
                  <td className={styles.nombre}>{p.nombre}</td>
                  <td>{p.oficina}</td>
                  <td>{p.n_eventos?.toLocaleString()}</td>
                  <td>{p.media_eventos_hora}</td>
                  <td>{p.std_eventos_hora}</td>
                  <td>{p.media_mb_dia?.toFixed(2)}</td>
                  <td>{p.pct_secreto?.toFixed(1)}%</td>
                  <td className={styles.ewma}>{p.ewma_score?.toFixed(4)}</td>
                  <td className={styles.score}>{p.score_actual?.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
