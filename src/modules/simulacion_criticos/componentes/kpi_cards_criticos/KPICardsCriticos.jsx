import { FaCircleCheck, FaCircleXmark, FaLock, FaShieldHalved } from "react-icons/fa6";
import base from "../../../MotorDeteccion/componentes/kpi_cards_monitoreo/KPICardsMonitoreo.module.css";
import { infoNivel } from "../../../../config/nivelesRiesgo";
import { cociente, porcentaje } from "../../simulacionCriticos";
import styles from "./KPICardsCriticos.module.css";

const numero = (valor) => Number(valor || 0).toLocaleString("es-PE");

// Tarjeta seleccionable: al hacer clic filtra la tabla por ese resultado.
function Tarjeta({ icono, claseIcono, etiqueta, valor, color, detalle, activo, onClick, titulo }) {
  const contenido = (
    <>
      <div className={`${base.iconWrapper} ${claseIcono}`}>{icono}</div>
      <div className={base.info}>
        <span className={base.label}>{etiqueta}</span>
        <span className={base.value} style={color ? { color } : undefined}>
          {valor}
        </span>
        <span className={base.subtext}>{detalle}</span>
      </div>
    </>
  );
  if (!onClick) return <div className={base.card}>{contenido}</div>;
  return (
    <button
      type="button"
      className={`${base.card} ${styles.tarjeta} ${activo ? styles.activa : ""}`}
      onClick={onClick}
      aria-pressed={activo}
      title={titulo}
    >
      {contenido}
    </button>
  );
}

export default function KPICardsCriticos({ actual, total, filtroResultado, onFiltrar }) {
  const recall = cociente(actual.detectados, actual.procesados);
  const alternar = (resultado) => onFiltrar(filtroResultado === resultado ? "" : resultado);

  return (
    <div className={base.grid}>
      <Tarjeta
        icono={<FaShieldHalved />}
        claseIcono={base.iconTotal}
        etiqueta="Procesados"
        valor={`${numero(actual.procesados)} / ${numero(total)}`}
        detalle="Eventos etiquetados como críticos"
        activo={filtroResultado === ""}
        onClick={() => onFiltrar("")}
        titulo="Ver todos los eventos procesados"
      />
      <Tarjeta
        icono={<FaCircleCheck />}
        claseIcono={styles.iconDetectado}
        etiqueta="Detectados"
        valor={numero(actual.detectados)}
        color="#047857"
        detalle={`Recall acumulado: ${porcentaje(recall)}`}
        activo={filtroResultado === "detectado"}
        onClick={() => alternar("detectado")}
        titulo="Filtrar solo los detectados"
      />
      <Tarjeta
        icono={<FaCircleXmark />}
        claseIcono={base.iconCritico}
        etiqueta="Omitidos"
        valor={numero(actual.omitidos)}
        color={infoNivel("critico").color}
        detalle={`${porcentaje(cociente(actual.omitidos, actual.procesados))} · posible fuga sin alerta`}
        activo={filtroResultado === "omitido"}
        onClick={() => alternar("omitido")}
        titulo="Filtrar solo los omitidos"
      />
      <Tarjeta
        icono={<FaLock />}
        claseIcono={base.iconAlto}
        etiqueta="Bloqueo (≥ 75 %)"
        valor={numero(actual.bloqueos)}
        color={infoNivel("alto").color}
        detalle="Eventos que bloquearían la cuenta"
      />
    </div>
  );
}
