import styles from "./MotivosDesglose.module.css";
import { FaFileLines, FaUserSecret } from "react-icons/fa6";

export default function MotivosDesglose({ motivosTraza = [], motivosEventos = [] }) {
  return (
    <div className={styles.container}>
      {/* Motivos Trazabilidad */}
      <div className={styles.panel}>
        <div className={styles.header}>
          <FaFileLines style={{ color: "#3b82f6" }} />
          <span>Explicabilidad XAI: Trazabilidad</span>
        </div>
        <p className={styles.sub}>
          Reglas de negocio y patrones topológicos documentales vulnerados
        </p>

        {motivosTraza && motivosTraza.length > 0 ? (
          <div className={styles.list}>
            {motivosTraza.map((m, idx) => (
              <div
                key={idx}
                className={styles.motiveCard}
                style={{ borderLeftColor: "#3b82f6" }}
              >
                <div className={styles.motiveTop}>
                  <span className={styles.codeBadge}>{m.codigo || "REGLA_TRAZA"}</span>
                  {m.puntos !== undefined && (
                    <span className={styles.pointsBadge}>+{m.puntos} pts</span>
                  )}
                </div>
                <div className={styles.desc}>{m.descripcion}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            No se identificaron infracciones determinísticas en la ruta documental.
          </div>
        )}
      </div>

      {/* Motivos Eventos */}
      <div className={styles.panel}>
        <div className={styles.header}>
          <FaUserSecret style={{ color: "#8b5cf6" }} />
          <span>Explicabilidad XAI: Comportamiento</span>
        </div>
        <p className={styles.sub}>
          Desviaciones conductuales y anomalías en accesos y acciones del usuario
        </p>

        {motivosEventos && motivosEventos.length > 0 ? (
          <div className={styles.list}>
            {motivosEventos.map((m, idx) => (
              <div
                key={idx}
                className={styles.motiveCard}
                style={{ borderLeftColor: "#8b5cf6" }}
              >
                <div className={styles.motiveTop}>
                  <span className={styles.codeBadge}>{m.codigo || "REGLA_EVENTO"}</span>
                  {m.puntos !== undefined && (
                    <span className={styles.pointsBadge}>+{m.puntos} pts</span>
                  )}
                </div>
                <div className={styles.desc}>{m.descripcion}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            No se registraron alertas de comportamiento irregular aisladas para este usuario.
          </div>
        )}
      </div>
    </div>
  );
}
