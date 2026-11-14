import { useMemo } from "react";
import { FaLock } from "react-icons/fa6";
import base from "../../../MotorDeteccion/MotorEventos.module.css";
import BadgeNivel from "../../../../components/nivel_riesgo/BadgeNivel";
import { NIVELES_RIESGO } from "../../../../config/nivelesRiesgo";
import { etiquetaTipo, filtrarCriticos, formatearFecha, score4 } from "../../simulacionCriticos";
import styles from "./TablaCriticos.module.css";

/** Registro de los eventos críticos ya procesados (el más reciente primero), con filtros por resultado y origen. */
export default function TablaCriticos({ eventos, indice, filtros, setFiltros, seleccionado, onSeleccionar }) {
  const visibles = useMemo(
    () => filtrarCriticos(eventos.slice(0, indice), filtros).reverse(),
    [eventos, indice, filtros],
  );
  const cambiar = (campo) => (e) => setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));

  return (
    <section className={base.panel} aria-labelledby="registro-criticos-titulo">
      <div className={base.header}>
        <div>
          <h2 id="registro-criticos-titulo">Registro de eventos críticos</h2>
          <p>
            {visibles.length.toLocaleString("es-PE")} de {indice.toLocaleString("es-PE")} procesados. Selecciona un evento
            para inspeccionarlo arriba.
          </p>
        </div>
        <div className={styles.filtros}>
          <select value={filtros.resultado} onChange={cambiar("resultado")} aria-label="Filtrar por resultado">
            <option value="">Todos los resultados</option>
            <option value="detectado">Detectados</option>
            <option value="omitido">Omitidos</option>
          </select>
          <select value={filtros.nivel_riesgo} onChange={cambiar("nivel_riesgo")} aria-label="Filtrar por nivel de riesgo">
            <option value="">Todos los niveles</option>
            {[...NIVELES_RIESGO].reverse().map((n) => (
              <option key={n.id} value={n.id}>
                {n.etiqueta}
              </option>
            ))}
          </select>
          <select value={filtros.origen} onChange={cambiar("origen")} aria-label="Filtrar por origen de la detección">
            <option value="">Todos los orígenes</option>
            <option value="politica">Política institucional</option>
            <option value="comportamiento">Comportamiento</option>
          </select>
          <input
            aria-label="Buscar eventos críticos"
            placeholder="Buscar usuario, oficina, documento o tipo…"
            value={filtros.busqueda}
            onChange={cambiar("busqueda")}
          />
        </div>
      </div>
      <div className={base.tablaScroll}>
        <table>
          <thead>
            <tr>
              <th scope="col">Evento</th>
              <th scope="col">Fecha</th>
              <th scope="col">Usuario</th>
              <th scope="col">Documento</th>
              <th scope="col">Acción</th>
              <th scope="col">Tipo de anomalía</th>
              <th scope="col">IF · 40%</th>
              <th scope="col">LSTM · 60%</th>
              <th scope="col">Score final</th>
              <th scope="col">Riesgo</th>
              <th scope="col">Origen</th>
              <th scope="col">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((e) => (
              <tr
                key={e.id_evento}
                className={`${e.detectado ? "" : styles.omitido} ${seleccionado === e.id_evento ? styles.seleccionado : ""}`}
              >
                <td>
                  <button type="button" onClick={() => onSeleccionar(e.id_evento)} aria-label={`Inspeccionar evento ${e.id_evento}`}>
                    #{e.id_evento}
                  </button>
                </td>
                <td>{formatearFecha(e.fecha_evento)}</td>
                <td>
                  {e.alcanza_bloqueo && <FaLock title="Alcanza el umbral de bloqueo" className={base.candado} />}{" "}
                  {e.name_user || `ID ${e.id_user}`}
                </td>
                <td>
                  {e.numero_documento || "—"} <small className={styles.clasificacion}>{e.name_clasificacion}</small>
                </td>
                <td>{e.name_tipo_evento || "—"}</td>
                <td>{etiquetaTipo(e.tipo_anomalia)}</td>
                <td>{score4(e.score_if_norm)}</td>
                <td>{score4(e.score_lstm_norm)}</td>
                <td>
                  <strong>{score4(e.score_final)}</strong>
                </td>
                <td>
                  <BadgeNivel nivel={e.nivel_riesgo} />
                </td>
                <td>{e.politica ? "Política" : "Modelos"}</td>
                <td>
                  <span className={e.detectado ? styles.detectado : styles.etiquetaOmitido}>
                    {e.detectado ? "Detectado" : "Omitido"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visibles.length && (
        <p className={base.vacio}>
          {indice ? "Ningún evento procesado coincide con los filtros." : "Inicia la simulación para ver los eventos."}
        </p>
      )}
    </section>
  );
}
