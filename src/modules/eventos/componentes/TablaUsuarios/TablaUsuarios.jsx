import { useState } from "react";
import styles from "./TablaUsuarios.module.css";
import TimelineUsuario from "../TimelineUsuario/TimelineUsuario";
import { useD2UsuarioDetalle } from "../../../../api/apiEventos";

const NIVEL_EMOJI = { critico: "🔴", alto: "🟠", medio: "🟡", bajo: "🟢" };

export default function TablaUsuarios({ usuarios = [] }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const detalleQuery = useD2UsuarioDetalle(selectedUser);

  if (!usuarios || usuarios.length === 0) return <p className={styles.empty}>Sin datos de usuarios</p>;

  return (
    <div className={styles.container}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Riesgo</th><th>Usuario</th><th>Oficina</th><th>Eventos</th>
              <th>Secretos</th><th>Descargas</th><th>MB</th><th>Fuera Hr</th><th>Score</th><th>Anómalos</th><th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.user_id} className={selectedUser === u.user_id ? styles.rowSelected : ""}>
                <td>{NIVEL_EMOJI[u.nivel_riesgo]} {u.nivel_riesgo}</td>
                <td className={styles.nombre}>{u.nombre}</td>
                <td>{u.oficina}</td>
                <td>{u.n_eventos?.toLocaleString()}</td>
                <td>{u.n_docs_secreto}</td>
                <td>{u.n_descargas}</td>
                <td>{u.total_mb?.toFixed(1)}</td>
                <td>{u.n_fuera_horario}</td>
                <td className={styles.score}>{u.score_riesgo?.toFixed(1)}</td>
                <td>{u.n_anomalos}</td>
                <td>
                  <button className={styles.btnDetalle} onClick={() => setSelectedUser(selectedUser === u.user_id ? null : u.user_id)}>
                    {selectedUser === u.user_id ? "▲ Cerrar" : "▼ Ver"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className={styles.detallePanel}>
          <h4>📋 Timeline de usuario: {usuarios.find(u => u.user_id === selectedUser)?.nombre}</h4>
          {detalleQuery.isLoading ? (
            <p className={styles.loading}>Cargando timeline...</p>
          ) : (
            <TimelineUsuario data={detalleQuery.data || []} />
          )}
        </div>
      )}
    </div>
  );
}
