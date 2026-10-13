import { infoNivel } from "../../config/nivelesRiesgo";
import styles from "./nivelRiesgo.module.css";

// Insignia con el color del nivel. Sin children muestra el nombre del nivel.
export default function BadgeNivel({ nivel, children, title }) {
  const info = infoNivel(nivel);
  return (
    <span className={styles.badge} title={title ?? `${info.etiqueta}: ${info.rareza}`}
      style={{ background: info.fondo, borderColor: info.borde, color: info.texto }}>
      <i style={{ background: info.color }} aria-hidden="true" />
      {children ?? info.etiqueta}
    </span>
  );
}
