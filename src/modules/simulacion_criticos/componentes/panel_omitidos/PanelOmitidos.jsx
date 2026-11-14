import { useMemo } from "react";
import { FaTriangleExclamation } from "react-icons/fa6";
import { etiquetaTipo, formatearFecha, score4 } from "../../simulacionCriticos";
import styles from "./PanelOmitidos.module.css";

/**
 * Críticos que el sistema dejó pasar: cada uno es una posible fuga sin alerta ni bloqueo.
 * Muestra cuánto le faltó al score para llegar al umbral y los motivos que sí encontró el motor.
 */
export default function PanelOmitidos({ eventos, indice, umbral, totalOmitidos, onSeleccionar }) {
  const omitidos = useMemo(() => eventos.slice(0, indice).filter((e) => !e.detectado), [eventos, indice]);

  return (
    <section className={styles.panel} aria-labelledby="omitidos-titulo">
      <div className={styles.cabecera}>
        <span className={styles.icono} aria-hidden="true">
          <FaTriangleExclamation />
        </span>
        <div>
          <h2 id="omitidos-titulo">Eventos críticos omitidos</h2>
          <p>
            {omitidos.length} de {totalOmitidos} omitidos en la evaluación completa. Su score quedó por debajo del umbral de
            anomalía ({Number(umbral).toFixed(3)}), así que no generaron alerta ni bloqueo.
          </p>
        </div>
      </div>
      {omitidos.length ? (
        <ul className={styles.lista}>
          {omitidos.map((e) => (
            <li key={e.id_evento}>
              <button type="button" className={styles.item} onClick={() => onSeleccionar(e.id_evento)}>
                <span className={styles.fila}>
                  <strong>#{e.id_evento}</strong>
                  <span className={styles.usuario}>{e.name_user || `ID ${e.id_user}`}</span>
                </span>
                <span className={styles.fecha}>{formatearFecha(e.fecha_evento)}</span>
                <span className={styles.tipo}>
                  {etiquetaTipo(e.tipo_anomalia)} · {e.name_tipo_evento} · {e.name_clasificacion}
                </span>
                <span className={styles.score}>
                  Score <b>{score4(e.score_final)}</b>
                  <span aria-hidden="true">·</span>
                  le faltó <b>{score4(Math.max(0, umbral - e.score_final))}</b> para el umbral
                </span>
                {e.motivos?.length > 0 && (
                  <span className={styles.motivos}>
                    {e.motivos.slice(0, 3).map((m) => (
                      <span key={m.codigo ?? m.descripcion}>{m.descripcion}</span>
                    ))}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.vacio}>
          {indice ? "Ningún crítico omitido hasta este punto de la simulación." : "Aún no se procesaron eventos."}
        </p>
      )}
    </section>
  );
}
