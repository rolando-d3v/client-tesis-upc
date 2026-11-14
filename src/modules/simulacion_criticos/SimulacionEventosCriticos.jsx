import { useMemo, useState } from "react";
import { FaCircleCheck, FaCrosshairs, FaFileCsv } from "react-icons/fa6";
import { useEvaluarDatasetEventos, useEventosCriticos } from "../../api/apiEvaluacion";
import LeyendaNiveles from "../../components/nivel_riesgo/LeyendaNiveles";
import BannerUltimoEvento from "../MotorDeteccion/componentes/banner_ultimo_evento/BannerUltimoEvento";
import GraficosDeteccion from "../MotorDeteccion/deteccion_automatica/GraficosDeteccion";
import base from "../MotorDeteccion/MotorEventos.module.css";
import ControlReproduccion from "./componentes/control_reproduccion/ControlReproduccion";
import KPICardsCriticos from "./componentes/kpi_cards_criticos/KPICardsCriticos";
import OrigenDeteccion from "./componentes/origen_deteccion/OrigenDeteccion";
import GraficosCriticos from "./componentes/graficos_criticos/GraficosCriticos";
import PanelOmitidos from "./componentes/panel_omitidos/PanelOmitidos";
import TablaCriticos from "./componentes/tabla_criticos/TablaCriticos";
import { useReproduccion } from "./useReproduccion";
import { VELOCIDADES, acumulados, formatearFecha, porcentaje, score4 } from "./simulacionCriticos";
import styles from "./SimulacionEventosCriticos.module.css";

const ESTADOS = {
  detenido: { texto: "Lista para simular", clase: base.estado },
  reproduciendo: { texto: "Simulando", clase: base.conectado },
  pausado: { texto: "En pausa", clase: base.estado },
  finalizado: { texto: "Simulación completa", clase: base.conectado },
};
const MODOS = { precision: "Precisión", recall: "Recall" };
const errorTexto = (error) =>
  typeof error?.response?.data?.detail === "string" ? error.response.data.detail : "No se pudo completar la solicitud.";

// El banner del motor espera los campos del evento en vivo; aquí solo se formatean para mostrarlos.
const paraBanner = (evento) =>
  evento && {
    ...evento,
    fecha_evento: formatearFecha(evento.fecha_evento),
    score_final: score4(evento.score_final),
    score_if_norm: score4(evento.score_if_norm),
    score_lstm_norm: score4(evento.score_lstm_norm),
  };

/** Reproducción de los eventos críticos de una evaluación. Se monta de nuevo con cada evaluación (key). */
function Simulacion({ paquete }) {
  const eventos = paquete.eventos;
  const [velocidad, setVelocidad] = useState(VELOCIDADES[2]);
  const reproduccion = useReproduccion(eventos.length, velocidad);
  const { indice, estado, finalizado } = reproduccion;
  const acumulado = useMemo(() => acumulados(eventos), [eventos]);
  const actual = acumulado[indice];
  const [filtros, setFiltros] = useState({ resultado: "", origen: "", nivel_riesgo: "", busqueda: "" });
  const [seleccionado, setSeleccionado] = useState(null);
  // Mismo formato que el feed del motor: el más reciente primero.
  const feed = useMemo(
    () =>
      eventos
        .slice(0, indice)
        .reverse()
        .map((e) => ({ ...e, fecha_evento: formatearFecha(e.fecha_evento) })),
    [eventos, indice],
  );
  const eventoBanner = eventos.find((e) => e.id_evento === seleccionado) ?? (indice ? eventos[indice - 1] : null);
  const filtrarResultado = (resultado) => setFiltros((prev) => ({ ...prev, resultado }));
  const { texto, clase } = ESTADOS[estado];

  return (
    <>
      <header className={base.header}>
        <div>
          <h1>
            <FaCrosshairs /> Simulación de eventos críticos
          </h1>
          <p>
            Reproducción cronológica de los {eventos.length.toLocaleString("es-PE")} eventos críticos de la última
            evaluación · Isolation Forest 0.40 + LSTM Autoencoder 0.60
          </p>
        </div>
        <span className={clase} role="status">
          {texto}
        </span>
      </header>

      <div className={base.modelo}>
        Dataset evaluado: <strong>{paquete.archivo}</strong> · Periodo: {formatearFecha(paquete.periodo_inicio)} a{" "}
        {formatearFecha(paquete.periodo_fin)} · Evaluación: {formatearFecha(paquete.fecha)}
        <br />
        Modo <strong>{MODOS[paquete.modo_operacion] ?? paquete.modo_operacion ?? "—"}</strong> · Umbral de anomalía:{" "}
        <strong>{Number(paquete.umbral).toFixed(3)}</strong> · <strong>Bloqueo automático con score ≥{" "}
        {Math.round(paquete.umbral_bloqueo * 100)} %</strong>. Los scores y decisiones son los de la evaluación: la
        simulación no vuelve a puntuar, no reentrena ni bloquea cuentas reales.
      </div>

      {!paquete.vigente && (
        <p role="alert" className={base.error}>
          Estos datos corresponden a una evaluación anterior o a otro modelo. Evalúa de nuevo en Entrenamiento para
          simular con el modelo activo.
        </p>
      )}

      <LeyendaNiveles />

      <ControlReproduccion
        reproduccion={reproduccion}
        total={eventos.length}
        velocidad={velocidad}
        onVelocidad={setVelocidad}
      />

      {finalizado && (
        <div className={styles.resultado} role="status">
          <FaCircleCheck aria-hidden="true" />
          <div>
            <strong>
              Eventos críticos detectados: {paquete.detectados.toLocaleString("es-PE")} de{" "}
              {paquete.total.toLocaleString("es-PE")} ({porcentaje(paquete.recall)})
            </strong>
            <span>
              Omitidos: {paquete.omitidos.toLocaleString("es-PE")}
              {paquete.intervalo &&
                ` · Intervalo de confianza 95 %: ${porcentaje(paquete.intervalo.inferior)} a ${porcentaje(paquete.intervalo.superior)}`}
              . Coincide con el Recall crítico de la evaluación en Entrenamiento.
            </span>
          </div>
        </div>
      )}

      <KPICardsCriticos
        actual={actual}
        total={eventos.length}
        filtroResultado={filtros.resultado}
        onFiltrar={filtrarResultado}
      />

      <BannerUltimoEvento evento={paraBanner(eventoBanner)} />

      <GraficosDeteccion eventos={feed} filtros={filtros} setFiltros={setFiltros} umbralAnomalia={paquete.umbral} />

      <OrigenDeteccion actual={actual} />

      <GraficosCriticos eventos={eventos} acumulado={acumulado} indice={indice} paquete={paquete} />

      <PanelOmitidos
        eventos={eventos}
        indice={indice}
        umbral={paquete.umbral}
        totalOmitidos={paquete.omitidos}
        onSeleccionar={setSeleccionado}
      />

      <TablaCriticos
        eventos={eventos}
        indice={indice}
        filtros={filtros}
        setFiltros={setFiltros}
        seleccionado={seleccionado}
        onSeleccionar={setSeleccionado}
      />
    </>
  );
}

export default function SimulacionEventosCriticos() {
  const consulta = useEventosCriticos("eventos");
  const evaluar = useEvaluarDatasetEventos();
  const paquete = consulta.data;

  if (paquete?.eventos?.length) {
    return (
      <div className={base.page}>
        <Simulacion key={paquete.evaluacion_id} paquete={paquete} />
      </div>
    );
  }

  return (
    <div className={base.page}>
      <header className={base.header}>
        <div>
          <h1>
            <FaCrosshairs /> Simulación de eventos críticos
          </h1>
          <p>Reproducción de los eventos críticos de la última evaluación del ensemble.</p>
        </div>
      </header>
      {consulta.isPending ? (
        <p role="status" className={styles.aviso}>
          Cargando eventos críticos…
        </p>
      ) : consulta.isError ? (
        <div role="alert" className={base.error}>
          {errorTexto(consulta.error)}{" "}
          <button type="button" className={styles.boton} onClick={() => consulta.refetch()}>
            Reintentar
          </button>
        </div>
      ) : (
        <section className={styles.vacio}>
          <h2>Todavía no hay eventos críticos para simular</h2>
          <p>
            {paquete
              ? "La última evaluación no contiene eventos etiquetados como críticos."
              : "Los datos se generan al evaluar el dataset reservado. Ejecuta la evaluación una vez (tarda unos segundos) y la simulación quedará disponible."}
          </p>
          {!paquete && (
            <button
              type="button"
              className={styles.boton}
              onClick={() => evaluar.mutate()}
              disabled={evaluar.isPending}
            >
              <FaFileCsv aria-hidden="true" /> {evaluar.isPending ? "Evaluando dataset…" : "Evaluar eventos reservados"}
            </button>
          )}
          {evaluar.isError && (
            <p role="alert" className={base.error}>
              {errorTexto(evaluar.error)}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
