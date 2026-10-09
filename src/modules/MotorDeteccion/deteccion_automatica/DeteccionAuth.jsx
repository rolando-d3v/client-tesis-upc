import React, { useState } from "react";
import styles from "./DeteccionAuth.module.css";
import ControlSimulador from "../componentes/control_simulador/ControlSimulador";
import BannerUltimoEvento from "../componentes/banner_ultimo_evento/BannerUltimoEvento";
import TablaEventosEnVivo from "../componentes/tabla_eventos_en_vivo/TablaEventosEnVivo";
import ModalInspeccionEvento from "../componentes/modal_inspeccion_evento/ModalInspeccionEvento";
import GraficosDeteccion from "./GraficosDeteccion";
import { FaTowerBroadcast, FaListUl, FaCirclePause } from "react-icons/fa6";
import { evaluarEstadoForense } from "../telemetria";

export default function DeteccionAuth({
  simuladorEstado = {
    activo: false,
    pausado: false,
    intervalo: 5.0,
    eventos_emitidos: 0,
    anomalias_detectadas: 0,
    criticos_detectados: 0,
    archivo: "dataset/dt_eventos_5000.csv",
  },
  intervaloConfig,
  setIntervaloConfig,
  cargandoAccion = false,
  onIniciar,
  onPausar,
  onReanudar,
  onDetener,
  onInyectarPrueba,
  onLimpiarFeed,
  onUploadCSV,
  isUploadingCSV = false,
  ultimoEvento = null,
  onNeutralizarUsuario,
  neutralizadosIds = [],
  eventos = [],
  filtros,
  setFiltros,
  eventoSeleccionado,
  setEventoSeleccionado,
  onSeleccionarEvento,
  autoScroll,
  setAutoScroll,
}) {
  // Manejo de estado interno de reserva por si no se proveen desde el padre
  const [internalIntervalo, setInternalIntervalo] = useState(5.0);
  const [internalAutoScroll, setInternalAutoScroll] = useState(true);
  const [internalFiltros, setInternalFiltros] = useState({
    nivel_riesgo: "",
    clasificacion: "",
    tipo_evento: "",
    busqueda: "",
  });
  const [internalEventoSeleccionado, setInternalEventoSeleccionado] = useState(null);

  const currentIntervalo = intervaloConfig !== undefined ? intervaloConfig : internalIntervalo;
  const handleSetIntervalo = setIntervaloConfig || setInternalIntervalo;

  const currentAutoScroll = autoScroll !== undefined ? autoScroll : internalAutoScroll;
  const handleSetAutoScroll = setAutoScroll || setInternalAutoScroll;

  const currentFiltros = filtros || internalFiltros;
  const handleSetFiltros = setFiltros || setInternalFiltros;

  const selectedEvento = eventoSeleccionado !== undefined ? eventoSeleccionado : internalEventoSeleccionado;

  const handleSelectEvento = (ev) => {
    if (onSeleccionarEvento) {
      onSeleccionarEvento(ev);
    }
    if (setEventoSeleccionado) {
      setEventoSeleccionado(ev);
    }
    if (eventoSeleccionado === undefined && !onSeleccionarEvento) {
      setInternalEventoSeleccionado(ev);
    }
  };

  const handleCloseModal = () => {
    if (setEventoSeleccionado) {
      setEventoSeleccionado(null);
    }
    if (onSeleccionarEvento) {
      onSeleccionarEvento(null);
    }
    setInternalEventoSeleccionado(null);
  };

  const isUltimoEventoNeutralizado = Boolean(
    evaluarEstadoForense(ultimoEvento, neutralizadosIds).esBloqueado,
  );
  const estadoFlujo = simuladorEstado.pausado
    ? "pausado"
    : simuladorEstado.activo
      ? "activo"
      : "espera";

  return (
    <div className={styles.container}>
      {/* PANEL DE CONTROL DE SIMULACIÓN Y CARGA DE CSV */}
      <ControlSimulador
        simuladorEstado={simuladorEstado}
        intervaloConfig={currentIntervalo}
        setIntervaloConfig={handleSetIntervalo}
        cargandoAccion={cargandoAccion}
        onIniciar={onIniciar}
        onPausar={onPausar}
        onReanudar={onReanudar}
        onDetener={onDetener}
        onInyectarPrueba={onInyectarPrueba}
        onLimpiarFeed={onLimpiarFeed}
        onUploadCSV={onUploadCSV}
        isUploadingCSV={isUploadingCSV}
      />

      <GraficosDeteccion eventos={eventos} filtros={currentFiltros} setFiltros={handleSetFiltros} />

      {/* ÚLTIMA DETECCIÓN Y REGISTRO DE EVENTOS */}
      <div className={styles.streamingRow}>
        <div className={styles.tableColumn}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeading}>
              <FaListUl aria-hidden="true" />
              <div>
                <h3>Registro de eventos en tiempo real</h3>
                <p>Busca, filtra e inspecciona la actividad detectada.</p>
              </div>
            </div>
            <span className={styles.windowBadge}>{eventos.length} eventos en el feed</span>
          </div>
          <TablaEventosEnVivo
            eventos={eventos}
            filtros={currentFiltros}
            setFiltros={handleSetFiltros}
            onSeleccionarEvento={handleSelectEvento}
            onNeutralizarUsuario={onNeutralizarUsuario}
            neutralizadosIds={neutralizadosIds}
            autoScroll={currentAutoScroll}
            setAutoScroll={handleSetAutoScroll}
          />
        </div>



        <section className={styles.radarColumn} aria-labelledby="deteccion-ultima-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeading}>
              <FaTowerBroadcast aria-hidden="true" />
              <div>
                <h3 id="deteccion-ultima-title">Última detección</h3>
                <p>Inspecciona el evento más reciente y su respuesta de contención.</p>
              </div>
            </div>
            <span
              className={`${styles.streamStatus} ${
                estadoFlujo === "activo"
                  ? styles.streamActive
                  : estadoFlujo === "pausado"
                    ? styles.streamPaused
                    : styles.streamIdle
              }`}
              role="status"
              aria-live="polite"
            >
              {estadoFlujo === "pausado" ? (
                <FaCirclePause aria-hidden="true" />
              ) : (
                <span className={styles.radarDot} aria-hidden="true" />
              )}
              {estadoFlujo === "pausado"
                ? "En pausa"
                : estadoFlujo === "activo"
                  ? "Simulación activa"
                  : "En espera"}
            </span>
          </div>
          <BannerUltimoEvento
            evento={ultimoEvento}
            onNeutralizarUsuario={onNeutralizarUsuario}
            isNeutralizado={isUltimoEventoNeutralizado}
          />
        </section>
      </div>

      {/* MODAL DE INSPECCIÓN DETALLADA */}
      {selectedEvento && (
        <ModalInspeccionEvento
          evento={selectedEvento}
          onClose={handleCloseModal}
          onNeutralizarUsuario={onNeutralizarUsuario}
          isNeutralizado={
            evaluarEstadoForense(selectedEvento, neutralizadosIds).esBloqueado
          }
        />
      )}
    </div>
  );
}
