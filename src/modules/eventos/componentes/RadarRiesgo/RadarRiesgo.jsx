import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useState } from "react";
import styles from "./RadarRiesgo.module.css";

const COLORES = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#38bdf8", "#c084fc", "#818cf8", "#f472b6"];

export default function RadarRiesgo({ usuarios = [] }) {
  const [selectedUsers, setSelectedUsers] = useState([0, 1]);

  if (!usuarios || usuarios.length === 0) return <p className={styles.empty}>Sin datos</p>;

  const toggleUser = (idx) => {
    setSelectedUsers(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx].slice(-4));
  };

  const dimensiones = ["horario", "volumen", "clasificacion", "cambio_comportamiento", "acciones_criticas", "score_if"];
  const labels = { horario: "Horario", volumen: "Volumen", clasificacion: "Clasificación", cambio_comportamiento: "Cambio Comp.", acciones_criticas: "Acciones Críticas", score_if: "Score IF" };

  const radarData = dimensiones.map(dim => {
    const item = { dimension: labels[dim] };
    selectedUsers.forEach(idx => {
      if (usuarios[idx]) item[usuarios[idx].nombre] = usuarios[idx][dim] || 0;
    });
    return item;
  });

  return (
    <div className={styles.container}>
      <div className={styles.userSelector}>
        {usuarios.slice(0, 10).map((u, idx) => (
          <button key={idx} className={`${styles.userBtn} ${selectedUsers.includes(idx) ? styles.active : ""}`}
            style={selectedUsers.includes(idx) ? { borderColor: COLORES[selectedUsers.indexOf(idx)] } : {}}
            onClick={() => toggleUser(idx)}>
            {u.nombre?.split(" ")[0]} ({u.score_riesgo?.toFixed(0)})
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="rgba(0,0,0,0.1)" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "#475569", fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }} />
          {selectedUsers.map((idx, i) => {
            const u = usuarios[idx];
            if (!u) return null;
            return (
              <Radar key={idx} name={u.nombre} dataKey={u.nombre} stroke={COLORES[i]} fill={COLORES[i]} fillOpacity={0.15} strokeWidth={2} />
            );
          })}
          <Tooltip contentStyle={{ background: "rgba(255, 255, 255, 0.95)", border: "1px solid #e2e8f0", borderRadius: 8, color: "#1e293b", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#475569" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
