import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./MonitoreoEnVivo.module.css";
import KPICardsMonitoreo from "./componentes/KPICardsMonitoreo";
import ControlSimulador from "./componentes/ControlSimulador";
import BannerUltimoEvento from "./componentes/BannerUltimoEvento";
import TablaEventosEnVivo from "./componentes/TablaEventosEnVivo";
import ModalInspeccionEvento from "./componentes/ModalInspeccionEvento";

import { API_MACHINE } from "../../../../api/apiRestMachine";
import {
  iniciarSimuladorAPI,
  pausarSimuladorAPI,
  reanudarSimuladorAPI,
  detenerSimuladorAPI,
  getEstadoSimuladorAPI,
  ingestarEventoAPI,
  cargarCSVSimuladorAPI,
} from "../../../../api/apiEventos";
import { toast } from "sonner";
import {
  FaBolt,
  FaArrowRotateRight,
} from "react-icons/fa6";

export default function MonitoreoEnVivo() {
  // Estado WebSocket
  const [conexionStatus, setConexionStatus] = useState("conectando"); // "conectado" | "conectando" | "desconectado"
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Estados de eventos y simulación
  const [eventos, setEventos] = useState([]);
  const [ultimoEvento, setUltimoEvento] = useState(null);
  const [simuladorEstado, setSimuladorEstado] = useState({
    activo: false,
    pausado: false,
    intervalo: 5.0,
    eventos_emitidos: 0,
    anomalias_detectadas: 0,
    criticos_detectados: 0,
    archivo: "dataset/dt_eventos_5000.csv",
  });

  const [intervaloConfig, setIntervaloConfig] = useState(5.0);
  const [filtros, setFiltros] = useState({
    nivel_riesgo: "",
    clasificacion: "",
    tipo_evento: "",
    busqueda: "",
  });

  const [autoScroll, setAutoScroll] = useState(true);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

  // Métricas acumuladas en sesión
  const totalRecibidos = eventos.length;
  const totalCriticos = eventos.filter((e) => e.nivel_riesgo === "critico").length;
  const totalAnomalias = eventos.filter((e) => e.es_anomalia).length;
  const scorePromedio =
    totalRecibidos > 0
      ? (
          eventos.reduce((acc, curr) => acc + (Number(curr.score_final) || 0), 0) /
          totalRecibidos
        ).toFixed(3)
      : "0.000";

  // Conectar WebSocket en tiempo real
  const conectarWebSocket = useCallback(() => {
    const wsBase = API_MACHINE.replace(/^http/, "ws");
    const wsUrl = `${wsBase}/eventos/ws/monitoreo`;

    try {
      setConexionStatus("conectando");
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConexionStatus("conectado");
        console.log("🟢 WebSocket conectado al flujo de eventos");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.tipo === "CONEXION_ESTABLECIDA") {
            if (data.simulador) {
              setSimuladorEstado((prev) => ({ ...prev, ...data.simulador }));
              if (data.simulador.intervalo) {
                setIntervaloConfig(data.simulador.intervalo);
              }
            }
          } else if (data.tipo === "NUEVO_EVENTO" && data.evento) {
            const ev = data.evento;
            setUltimoEvento(ev);
            setEventos((prev) => [ev, ...prev].slice(0, 300)); // Mantener los últimos 300 en memoria

            if (ev.nivel_riesgo === "critico") {
              toast.error(
                `🚨 Evento Crítico #${ev.id_evento}: ${ev.name_user} descargó ${ev.size_archivo_mb} MB (${ev.name_clasificacion})`
              );
            }

            if (data.simulador) {
              setSimuladorEstado((prev) => ({ ...prev, ...data.simulador }));
            }
          } else if (data.tipo === "SIMULADOR_FINALIZADO") {
            toast.info("Simulación finalizada: se procesaron todos los registros del CSV.");
            if (data.simulador) {
              setSimuladorEstado((prev) => ({ ...prev, ...data.simulador }));
            }
          } else if (data.simulador) {
            setSimuladorEstado((prev) => ({ ...prev, ...data.simulador }));
          }
        } catch (err) {
          console.error("Error parseando mensaje WS:", err);
        }
      };

      ws.onclose = () => {
        setConexionStatus("desconectado");
        console.warn("🔴 WebSocket desconectado. Reintentando en 3s...");
        reconnectTimeoutRef.current = setTimeout(() => {
          conectarWebSocket();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error("Error en WebSocket:", err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("No se pudo instanciar WebSocket:", e);
      setConexionStatus("desconectado");
    }
  }, []);

  useEffect(() => {
    conectarWebSocket();

    // Consultar estado inicial del simulador vía REST
    getEstadoSimuladorAPI()
      .then((estado) => {
        if (estado) {
          setSimuladorEstado(estado);
          if (estado.intervalo) setIntervaloConfig(estado.intervalo);
        }
      })
      .catch((e) => console.log("Simulador inactivo al iniciar:", e));

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [conectarWebSocket]);

  // Handlers para el Simulador
  const handleIniciar = async () => {
    try {
      setCargandoAccion(true);
      const res = await iniciarSimuladorAPI({
        intervalo: Number(intervaloConfig),
      });
      setSimuladorEstado((prev) => ({
        ...prev,
        ...res,
        activo: true,
        pausado: false,
      }));
      toast.success(
        `Simulación en línea iniciada: emitiendo cada ${intervaloConfig}s.`
      );
    } catch (err) {
      console.error("Error iniciando simulador:", err);
      toast.error("Error al iniciar el simulador de eventos.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handlePausar = async () => {
    try {
      setCargandoAccion(true);
      const res = await pausarSimuladorAPI();
      setSimuladorEstado((prev) => ({ ...prev, ...res, pausado: true }));
      toast.info("Simulación pausada.");
    } catch (err) {
      console.error("Error pausando simulador:", err);
      toast.error("Error al pausar el simulador.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleReanudar = async () => {
    try {
      setCargandoAccion(true);
      const res = await reanudarSimuladorAPI();
      setSimuladorEstado((prev) => ({ ...prev, ...res, pausado: false }));
      toast.success("Simulación reanudada.");
    } catch (err) {
      console.error("Error reanudando simulador:", err);
      toast.error("Error al reanudar el simulador.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleDetener = async () => {
    try {
      setCargandoAccion(true);
      const res = await detenerSimuladorAPI();
      setSimuladorEstado((prev) => ({
        ...prev,
        ...res,
        activo: false,
        pausado: false,
      }));
      toast.warning("Simulación detenida y contadores reiniciados.");
    } catch (err) {
      console.error("Error deteniendo simulador:", err);
      toast.error("Error al detener el simulador.");
    } finally {
      setCargandoAccion(false);
    }
  };

  // Inyección de evento crítico de prueba (Sustentación SOC)
  const handleInyectarPrueba = async () => {
    try {
      setCargandoAccion(true);
      const demoCritico = {
        ID_EVENTO: Math.floor(Math.random() * 900000) + 100000,
        FECHA_EVENTO: new Date().toLocaleDateString("es-PE") + " 23:45:10",
        ID_OFICINA: 2,
        NAME_OFICINA: "B-2 (SDI)",
        ID_USER: 20043477,
        NAME_USER: "CARLOS ALBERTO",
        ID_DOCUMENTO: 152672,
        NUMERO_DOCUMENTO: "DOC-SECRETO-99",
        FECHA_DEL_DOCUMENTO: "21/1/2026",
        ID_TIPO_DOCUMENTO: 2,
        ID_CLASIFICACION: 1, // SECRETO
        NAME_CLASIFICACION: "SECRETO",
        DOC_INTERNO_EXTERNO: "exterior",
        size_archivo_mb: 24.8, // Descarga muy anómala
        NAME_ROLE: "USER",
        ID_TIPO_EVENTO: 2, // DESCARGAR
        NAME_TIPO_EVENTO: "DESCARGAR",
      };
      await ingestarEventoAPI(demoCritico);
      toast.success("¡Evento de prueba crítico inyectado exitosamente!");
    } catch (err) {
      console.error("Error inyectando evento de prueba:", err);
      toast.error("Error al inyectar evento de prueba.");
    } finally {
      setCargandoAccion(false);
    }
  };

  // Carga de archivo CSV para monitoreo online
  const handleUploadCSV = async (file) => {
    try {
      setIsUploadingCSV(true);
      const res = await cargarCSVSimuladorAPI({
        file,
        intervalo: Number(intervaloConfig),
        autoIniciar: true,
      });

      toast.success(
        res.mensaje || `Archivo ${file.name} cargado. Simulación online iniciada.`
      );

      if (res.simulador) {
        setSimuladorEstado((prev) => ({
          ...prev,
          ...res.simulador,
          activo: true,
          pausado: false,
        }));
      }
    } catch (err) {
      console.error("Error cargando CSV para simulador:", err);
      toast.error(
        err?.response?.data?.detail || "Error al cargar el archivo CSV para simulación."
      );
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleLimpiarFeed = () => {
    setEventos([]);
    setUltimoEvento(null);
    toast.info("Historial en pantalla limpiado.");
  };

  // Quick Filter Pills (igual que IncidentesPage)
  const handleQuickFilter = (tipo) => {
    if (tipo === "critico") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "critico" }));
    } else if (tipo === "anomalia") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "anomalia" }));
    } else if (tipo === "alto") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "alto" }));
    } else if (tipo === "fuera_horario") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "fuera_horario" }));
    } else if (tipo === "exterior") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "exterior" }));
    } else {
      setFiltros({
        nivel_riesgo: "",
        clasificacion: "",
        tipo_evento: "",
        busqueda: "",
      });
    }
  };

  return (
    <div className={styles.page}>
      {/* HEADER SECTION */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            <FaBolt style={{ color: "#7c3aed" }} />
            Monitoreo en Vivo de Eventos (Fase Online)
          </h1>
          <p className={styles.subtitle}>
            Centro de Operaciones de Seguridad (SOC): Detección Predictiva Registro a Registro con Isolation Forest, Reglas y Perfiles Welford/EWMA
          </p>
        </div>

        {/* WebSocket Connection Status Pill */}
        <div>
          {conexionStatus === "conectado" && (
            <div className={`${styles.connectionBadge} ${styles.badgeConectado}`}>
              <span className={styles.liveDot} />
              Stream Online Activo
            </div>
          )}
          {conexionStatus === "conectando" && (
            <div className={`${styles.connectionBadge} ${styles.badgeConectando}`}>
              <span className={styles.liveDot} />
              Conectando WebSocket...
            </div>
          )}
          {conexionStatus === "desconectado" && (
            <button
              onClick={conectarWebSocket}
              className={`${styles.connectionBadge} ${styles.badgeDesconectado}`}
              style={{ cursor: "pointer" }}
            >
              <FaArrowRotateRight /> Reconectar WS
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS (Exactamente igual a KPICardsSOC) */}
      <KPICardsMonitoreo
        totalEventos={totalRecibidos}
        totalCriticos={totalCriticos}
        totalAnomalias={totalAnomalias}
        scorePromedio={scorePromedio}
        onFilterClick={handleQuickFilter}
      />

      {/* PANEL DE CONTROL DE SIMULACIÓN Y CARGA DE CSV */}
      <ControlSimulador
        simuladorEstado={simuladorEstado}
        intervaloConfig={intervaloConfig}
        setIntervaloConfig={setIntervaloConfig}
        cargandoAccion={cargandoAccion}
        onIniciar={handleIniciar}
        onPausar={handlePausar}
        onReanudar={handleReanudar}
        onDetener={handleDetener}
        onInyectarPrueba={handleInyectarPrueba}
        onLimpiarFeed={handleLimpiarFeed}
        onUploadCSV={handleUploadCSV}
        isUploadingCSV={isUploadingCSV}
      />

      {/* RADAR: BANNER ÚLTIMO EVENTO INGESTADO */}
      <BannerUltimoEvento evento={ultimoEvento} />

      {/* QUICK FILTER PILLS (Exactamente igual a IncidentesPage) */}
      <div className={styles.filterPills}>
        <button
          className={`${styles.pill} ${
            !filtros.nivel_riesgo ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("todos")}
        >
          Todos los Eventos
        </button>

        <button
          className={`${styles.pill} ${styles.pillCritico} ${
            filtros.nivel_riesgo === "critico" ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("critico")}
        >
          🚨 Solo Críticos ({totalCriticos})
        </button>

        <button
          className={`${styles.pill} ${styles.pillAlto} ${
            filtros.nivel_riesgo === "anomalia" ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("anomalia")}
        >
          ⚠️ Solo Anomalías ({totalAnomalias})
        </button>

        <button
          className={`${styles.pill} ${
            filtros.nivel_riesgo === "alto" ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("alto")}
        >
          🔥 Nivel Alto
        </button>

        <button
          className={`${styles.pill} ${
            filtros.nivel_riesgo === "exterior" ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("exterior")}
        >
          🌐 Hacia Exterior
        </button>

        <button
          className={`${styles.pill} ${
            filtros.nivel_riesgo === "fuera_horario" ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("fuera_horario")}
        >
          🕒 Fuera de Horario
        </button>
      </div>

      {/* TABLA DE EVENTOS EN VIVO (TanStack Table con estilos de TablaIncidentes) */}
      <TablaEventosEnVivo
        eventos={eventos}
        filtros={filtros}
        setFiltros={setFiltros}
        onSeleccionarEvento={(ev) => setEventoSeleccionado(ev)}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
      />

      {/* MODAL DE INSPECCIÓN DETALLADA */}
      {eventoSeleccionado && (
        <ModalInspeccionEvento
          evento={eventoSeleccionado}
          onClose={() => setEventoSeleccionado(null)}
        />
      )}
    </div>
  );
}
