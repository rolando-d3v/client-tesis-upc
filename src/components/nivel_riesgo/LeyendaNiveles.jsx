import { NIVELES_RIESGO } from "../../config/nivelesRiesgo";
import styles from "./nivelRiesgo.module.css";

const pct = (valor) => `${Math.round(valor * 100)} %`;

// Leyenda de los cuatro niveles: rango del score, color y qué tan raro es frente al entrenamiento.
export default function LeyendaNiveles({ titulo = "Niveles de riesgo del score" }) {
  return (
    <div className={styles.leyenda} role="list" aria-label={titulo}>
      {NIVELES_RIESGO.map((n) => (
        <div key={n.id} role="listitem" className={styles.item} style={{ background: n.fondo, borderColor: n.borde }}>
          <i style={{ background: n.color }} aria-hidden="true" />
          <div>
            <strong style={{ color: n.texto }}>{n.etiqueta}</strong>
            <span>{n.id === "critico" ? `≥ ${pct(n.desde)}` : `${pct(n.desde)} – ${pct(n.hasta)}`} · {n.rareza}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
