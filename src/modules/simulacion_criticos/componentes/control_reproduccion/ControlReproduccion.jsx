import { FaBackwardStep, FaForwardFast, FaForwardStep, FaPause, FaPlay } from "react-icons/fa6";
import base from "../../../MotorDeteccion/componentes/control_simulador/ControlSimulador.module.css";
import { VELOCIDADES } from "../../simulacionCriticos";
import styles from "./ControlReproduccion.module.css";

// Mismos controles y estilos que el simulador del motor, aplicados a la reproducción de la evaluación.
export default function ControlReproduccion({ reproduccion, total, velocidad, onVelocidad }) {
  const { indice, estado, finalizado, iniciar, pausar, reanudar, avanzar, completar, reiniciar } = reproduccion;
  const progreso = total ? (indice / total) * 100 : 0;

  return (
    <div className={base.panel}>
      <div className={base.topRow}>
        <div className={base.controlsLeft}>
          <label className={base.controlGroup}>
            <span className={base.controlLabel}>Velocidad:</span>
            <select
              className={`${base.cadenceSelect} ${styles.selectVelocidad}`}
              value={velocidad.id}
              onChange={(e) => onVelocidad(VELOCIDADES.find((v) => v.id === e.target.value))}
              aria-label="Velocidad de reproducción"
            >
              {VELOCIDADES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.etiqueta}
                </option>
              ))}
            </select>
          </label>

          {estado === "reproduciendo" ? (
            <button type="button" onClick={pausar} className={base.btnWarning}>
              <FaPause /> Pausar
            </button>
          ) : estado === "pausado" ? (
            <button type="button" onClick={reanudar} className={base.btnPrimary}>
              <FaPlay /> Reanudar
            </button>
          ) : (
            <button type="button" onClick={iniciar} className={base.btnPrimary} disabled={!total}>
              <FaPlay /> {finalizado ? "Repetir simulación" : "Iniciar simulación"}
            </button>
          )}
          <button
            type="button"
            onClick={avanzar}
            className={base.btnSecondary}
            disabled={finalizado}
            title="Procesar solo el siguiente evento"
          >
            <FaForwardStep /> Siguiente evento
          </button>
          <button
            type="button"
            onClick={completar}
            className={base.btnSecondary}
            disabled={finalizado}
            title="Procesar todos los eventos y ver el resultado final"
          >
            <FaForwardFast /> Ir al resultado final
          </button>
        </div>

        <div className={base.controlsRight}>
          <span className={base.emitidos}>
            <strong className={base.emitidosValor}>{indice.toLocaleString("es-PE")}</strong>/{" "}
            {total.toLocaleString("es-PE")} eventos
          </span>
          <button type="button" onClick={reiniciar} className={base.btnDanger} disabled={indice === 0}>
            <FaBackwardStep /> Reiniciar
          </button>
        </div>
      </div>

      <div
        className={styles.progreso}
        role="progressbar"
        aria-label="Avance de la simulación"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={indice}
      >
        <span style={{ width: `${progreso}%` }} />
      </div>
    </div>
  );
}
