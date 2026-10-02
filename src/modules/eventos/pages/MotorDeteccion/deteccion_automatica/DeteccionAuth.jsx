import React, { useState } from "react";
import styles from "./DeteccionAuth.module.css";
import ControlSimulador from "../componentes/ControlSimulador";
import BannerUltimoEvento from "../componentes/BannerUltimoEvento";
import TablaEventosEnVivo from "../componentes/TablaEventosEnVivo";
import ModalInspeccionEvento from "../componentes/ModalInspeccionEvento";
import GraficosDeteccion from "./GraficosDeteccion";
import { FaTowerBroadcast, FaListUl, FaCirclePause } from "react-icons/fa6";

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
    ultimoEvento && neutralizadosIds?.includes(String(ultimoEvento.id_user || ultimoEvento.name_user)),
  );

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
        <div className={styles.radarColumn}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeading}>
              <FaTowerBroadcast aria-hidden="true" />
              <div>
                <h3>Última detección</h3>
                <p>Inspecciona el evento más reciente y su respuesta de contención.</p>
              </div>
            </div>
            <span
              className={`${styles.streamStatus} ${simuladorEstado.activo && !simuladorEstado.pausado ? styles.streamActive : ""}`}
            >
              {simuladorEstado.pausado ? <FaCirclePause aria-hidden="true" /> : <span className={styles.radarDot} />}
              {simuladorEstado.pausado ? "En pausa" : simuladorEstado.activo ? "Simulación activa" : "En espera"}
            </span>
          </div>
          <BannerUltimoEvento
            evento={ultimoEvento}
            onNeutralizarUsuario={onNeutralizarUsuario}
            isNeutralizado={isUltimoEventoNeutralizado}
          />
        </div>

        <div className={styles.tableColumn}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeading}>
              <FaListUl aria-hidden="true" />
              <div>
                <h3>Registro de eventos</h3>
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
      </div>

      {/* MODAL DE INSPECCIÓN DETALLADA */}
      {selectedEvento && (
        <ModalInspeccionEvento
          evento={selectedEvento}
          onClose={handleCloseModal}
          onNeutralizarUsuario={onNeutralizarUsuario}
          isNeutralizado={
            neutralizadosIds && neutralizadosIds.includes(String(selectedEvento.id_user || selectedEvento.name_user))
          }
        />
      )}
    </div>
  );
}
