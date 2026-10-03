import React, { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from "react";
import styles from "./motorDeteccion.module.css";
import KPICardsMonitoreo from "./componentes/KPICardsMonitoreo";
import DeteccionAuth from "./deteccion_automatica/DeteccionAuth";
import {
  acumularEvento,
  combinarResumenSOC,
  correlacionarEnVivo,
  crearTelemetria,
  listarIncidentesEnVivo,
} from "./telemetria";
import { useQueryClient } from "@tanstack/react-query";

// Componentes Analíticos SOC (compartidos con Entrenamiento)
import GraficoEvolucionRiesgos from "../entrenamiento/componentes/GraficoEvolucionRiesgos";
import GraficoTipoEvento from "../entrenamiento/componentes/GraficoTipoEvento";
import DashboardSOCAnalytics from "../entrenamiento/componentes/DashboardSOCAnalytics";
import TablaIncidentesMotor from "./componentes/TablaIncidentesMotor";

import { API_MACHINE } from "../../api/apiRestMachine";
import {
  iniciarSimuladorAPI,
  pausarSimuladorAPI,
  reanudarSimuladorAPI,
  detenerSimuladorAPI,
  getEstadoSimuladorAPI,
  ingestarEventoAPI,
  cargarCSVSimuladorAPI,
  limpiarSimuladorAPI,
} from "../../api/apiEventos";
import {
  useResumenSOC,
  useIncidentes,
  useAlertasBloqueados,
  postNeutralizarUsuario,
} from "../../api/apiCorrelacion";
import { toast } from "sonner";
import {
  FaBolt,
  FaArrowRotateRight,
  FaTv,
  FaChartLine,
  FaLayerGroup,
  FaShieldHalved,
  FaBan,
  FaFolderOpen,
} from "react-icons/fa6";

export default function MotorDeteccion() {
  const queryClient = useQueryClient();
  // Modos de Vista: "integral" (ambos), "streaming" (solo feed/simulador), "graficos" (solo analítica SOC)
  const [viewMode, setViewMode] = useState("integral");

  // Neutralización Automática vs Supervisada
  const [autoNeutralize, setAutoNeutralize] = useState(false);
  const autoNeutralizeRef = useRef(false);
  const [neutralizadosIds, setNeutralizadosIds] = useState([]);
  const neutralizacionesPendientesRef = useRef(new Set());
  const neutralizadosRef = useRef(new Set());

  useEffect(() => {
    autoNeutralizeRef.current = autoNeutralize;
  }, [autoNeutralize]);

  // Estado WebSocket
  const [conexionStatus, setConexionStatus] = useState("conectando"); // "conectado" | "conectando" | "desconectado"
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const montadoRef = useRef(false);

  // Estados de eventos y simulación
  const [eventos, setEventos] = useState([]);
  const [ultimoEvento, setUltimoEvento] = useState(null);
  const [telemetria, setTelemetria] = useState(crearTelemetria);
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

  // Estado para los Gráficos Analíticos SOC (mismos de IncidentesPage)
  const [pageSOC, setPageSOC] = useState(1);
  const [filtrosSOC, setFiltrosSOC] = useState({
    nivel_riesgo: "",
    estado: "",
    clasificacion: "",
    busqueda: "",
    mes: "",
    tipo_evento: "",
  });

  const { data: resumenSOC } = useResumenSOC();
  const { data: alertasBloqueo } = useAlertasBloqueados();
  const { data: incidentesData } = useIncidentes({
    page: pageSOC,
    page_size: 10,
    ...filtrosSOC,
  });

  // Estado para Expediente Forense (TablaIncidentes en Motor de Detección)
  // Correlación en vivo: un incidente por par (documento, usuario) que se actualiza con cada evento.
  const [incidentesPares, setIncidentesPares] = React.useState({});
  const incidentesEnVivo = useMemo(() => listarIncidentesEnVivo(incidentesPares), [incidentesPares]);
  // IDs de evento ya contados: si el CSV vuelve a empezar (bucle / reinicio) el evento repetido
  // se muestra en el feed pero no se vuelve a sumar a gráficos, KPIs ni incidentes.
  const eventosContadosRef = useRef(new Set());
  const [repetidosOmitidos, setRepetidosOmitidos] = useState(0);
  const [pageIncidentes, setPageIncidentes] = React.useState(1);
  const [pageSizeIncidentes, setPageSizeIncidentes] = React.useState(10);
  const [filtrosIncidentes, setFiltrosIncidentes] = React.useState({
    nivel_riesgo: "",
    estado: "",
    clasificacion: "",
    busqueda: "",
    mes: "",
    tipo_evento: "",
  });
  const {
    data: incidentesForenseData,
    isLoading: loadingForense,
  } = useIncidentes({
    page: pageIncidentes,
    page_size: pageSizeIncidentes,
    ...filtrosIncidentes,
  });

  const handleQuickFilterIncidentes = (tipo) => {
    if (tipo === "critico") {
      setFiltrosIncidentes((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "critico" ? "" : "critico",
        estado: "",
      }));
    } else if (tipo === "alto") {
      setFiltrosIncidentes((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "alto" ? "" : "alto",
        estado: "",
      }));
    } else if (tipo === "abierto") {
      setFiltrosIncidentes((prev) => ({
        ...prev,
        nivel_riesgo: "",
        estado: prev.estado === "abierto" ? "" : "abierto",
      }));
    } else {
      setFiltrosIncidentes({ nivel_riesgo: "", estado: "", clasificacion: "", busqueda: "", mes: "", tipo_evento: "" });
    }
    setPageIncidentes(1);
  };

  // El feed es una ventana de 300 filas; la telemetría acumula toda la sesión.
  const totalRecibidos = telemetria.total_eventos_analizados;
  const totalCriticos = telemetria.criticos;
  const totalAnomalias = telemetria.anomalias;
  const scorePromedio = totalRecibidos
    ? (telemetria.score_total / totalRecibidos).toFixed(3)
    : "0.000";

  const cuentasBloqueadas = new Set([
    ...(Array.isArray(alertasBloqueo) ? alertasBloqueo.map((alerta) => String(alerta.id_user)) : []),
    ...neutralizadosIds,
  ]);
  const totalBloqueados = cuentasBloqueadas.size;

  // Los gráficos leen una versión diferida: React prioriza el feed/KPIs y repinta
  // las gráficas en cuanto puede, así una ráfaga de eventos no las congela ni las salta.
  const telemetriaGraficos = useDeferredValue(telemetria);
  const neutralizadosGraficos = useDeferredValue(neutralizadosIds);
  const resumenEnVivo = useMemo(
    () => combinarResumenSOC(resumenSOC, telemetriaGraficos, neutralizadosGraficos),
    [resumenSOC, telemetriaGraficos, neutralizadosGraficos]
  );
  // Lista combinada de incidentes para el modal y tabla de analytics:
  // los correlacionados en vivo (1 por documento+usuario) primero, luego los persistidos.
  const listaIncidentesEnVivo = useMemo(
    () => [...incidentesEnVivo, ...(incidentesData?.incidentes || [])],
    [incidentesData?.incidentes, incidentesEnVivo]
  );

  // Ejecución de Neutralización Preventiva (Manual o Automática)
  const handleNeutralizarUsuario = useCallback(async (evento, motivoCustom = null) => {
    const userId = evento.id_user ?? evento.user_id;
    const userName = evento.name_user || evento.nombre || "Usuario";
    if (userId == null || !evento.evento_registro_id) {
      toast.error("El evento no tiene persistencia confirmada; no se puede verificar el bloqueo.");
      return;
    }
    const userKey = String(userId);
    if (neutralizadosRef.current.has(userKey) || neutralizacionesPendientesRef.current.has(userKey)) return;
    neutralizacionesPendientesRef.current.add(userKey);
    const motivo =
      motivoCustom ||
      `Neutralización inmediata en vivo: Detección crítica en evento #${evento.id_evento} (${evento.name_clasificacion || "Documento"}) por ${userName}`;

    try {
      const resultado = await postNeutralizarUsuario({
        id_evento: evento.id_evento,
        evento_registro_id: evento.evento_registro_id,
        id_user: userId,
        nombre_usuario: userName,
        motivo,
        responsable: "MOTOR_DETECCION_REALTIME",
      });
      if (resultado?.confirmacion_bloqueo !== true) {
        throw new Error("El servidor no confirmó el bloqueo de la cuenta.");
      }
      neutralizadosRef.current.add(userKey);
      if (!montadoRef.current) return;
      setNeutralizadosIds((prev) => [...new Set([...prev, userKey])]);
      queryClient.invalidateQueries({ queryKey: ["alertas_bloqueados"] });
      toast.success(`🛡️ Usuario ${userName} neutralizado y cuenta bloqueada en tiempo real.`);
    } catch (err) {
      console.error("Error neutralizando:", err);
      if (montadoRef.current) {
        toast.error(err.response?.data?.detail || err.message || `No se pudo neutralizar a ${userName}.`);
      }
    } finally {
      neutralizacionesPendientesRef.current.delete(userKey);
    }
  }, [queryClient]);

  // Conectar WebSocket en tiempo real
  const conectarWebSocket = useCallback(function conectar() {
    if (!montadoRef.current || (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING)) return;
    clearTimeout(reconnectTimeoutRef.current);
    const wsBase = API_MACHINE.replace(/^http/, "ws").replace(/\/$/, "");
    const wsUrl = `${wsBase}/eventos/ws/monitoreo`;

    try {
      setConexionStatus("conectando");
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConexionStatus("conectado");
        console.log("🟢 WebSocket conectado al flujo de eventos");
      };

      ws.onmessage = (event) => {
        if (!montadoRef.current || wsRef.current !== ws) return;
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

            const claveEvento = ev.id_evento != null ? String(ev.id_evento) : null;
            if (claveEvento !== null && eventosContadosRef.current.has(claveEvento)) {
              // Evento repetido (el CSV volvió a empezar): no se vuelve a contar ni a neutralizar.
              setRepetidosOmitidos((n) => n + 1);
            } else {
              if (claveEvento !== null) eventosContadosRef.current.add(claveEvento);
              const recibidoEn = new Date();
              // La correlación del par (documento, usuario) la calcula el backend en tiempo real
              // (0.45·trazabilidad + 0.55·eventos, o el dominio disponible si falta uno) y llega
              // junto al evento; aquí solo se registra.
              const correlacion = data.correlacion ?? null;
              setTelemetria((prev) => acumularEvento(prev, ev, recibidoEn, correlacion));

              // Mantiene el incidente del par si el evento o su correlación califican como amenaza
              // (anomalía, riesgo alto/crítico o score >= UMBRAL_ALTO).
              setIncidentesPares((prev) => correlacionarEnVivo(prev, ev, correlacion, Date.now()));

              // Criterio institucional según constantes.py: UMBRAL_CRITICO = 0.75
              const esCritico = ev.nivel_riesgo === "critico" || Number(ev.score_final || 0) >= 0.75;
              if (esCritico) {
                // Marca visual inmediata (los gráficos pasan el incidente a "Contenido").
                // OJO: no tocar neutralizadosRef aquí; lo agrega handleNeutralizarUsuario
                // cuando el servidor confirma el bloqueo. Si se agregara antes, esa función
                // retornaría al instante y el POST /correlacion/neutralizar nunca saldría.
                const userKey = String(ev.id_user ?? ev.user_id ?? ev.name_user ?? "");
                if (userKey) {
                  setNeutralizadosIds((prev) => (prev.includes(userKey) ? prev : [...prev, userKey]));
                }

                toast.error(
                  `🚨 Evento Crítico #${ev.id_evento}: ${ev.name_user} descargó ${ev.size_archivo_mb} MB (${ev.name_clasificacion}) — Auto-Contenido y cuenta bloqueada en tiempo real.`
                );

                // Neutralización Automática / persistencia en backend
                handleNeutralizarUsuario(
                  ev,
                  "Neutralización automática en tiempo real: Amenaza crítica detectada según constantes.py (Score >= 0.75 / UMBRAL_CRITICO)"
                );
              }
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
        if (!montadoRef.current || wsRef.current !== ws) return;
        wsRef.current = null;
        setConexionStatus("desconectado");
        console.warn("🔴 WebSocket desconectado. Reintentando en 3s...");
        reconnectTimeoutRef.current = setTimeout(() => {
          conectar();
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
  }, [handleNeutralizarUsuario]);

  useEffect(() => {
    montadoRef.current = true;
    conectarWebSocket();
    return () => {
      montadoRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
        ws.close();
      }
    };
  }, [conectarWebSocket]);

  // Controles de Simulación
  const handleIniciar = async () => {
    setCargandoAccion(true);
    try {
      await iniciarSimuladorAPI({ intervalo: intervaloConfig });
      toast.success("Simulador iniciado a velocidad continua.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al iniciar simulador");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handlePausar = async () => {
    setCargandoAccion(true);
    try {
      await pausarSimuladorAPI();
      toast.info("Simulación en pausa");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al pausar");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleReanudar = async () => {
    setCargandoAccion(true);
    try {
      await reanudarSimuladorAPI();
      toast.success("Simulación reanudada");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al reanudar");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleDetener = async () => {
    setCargandoAccion(true);
    try {
      await detenerSimuladorAPI();
      toast.warning("Simulación detenida y reiniciada a inicio de archivo");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al detener");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleInyectarPrueba = async (tipoPrueba) => {
    setCargandoAccion(true);
    try {
      let payload = {
        name_user: "Juan Pérez",
        id_user: 74185296,
        name_oficina: "Dirección de Inteligencia",
        numero_documento: "PL-SEG-2026-004",
        name_clasificacion: "SECRETO",
        name_tipo_evento: "DOWNLOAD",
        doc_interno_externo: "exterior",
        size_archivo_mb: 48.5,
        hora_evento: 23,
      };

      if (tipoPrueba === "critico") {
        payload = {
          name_user: "Carlos Méndez",
          id_user: 45821937,
          name_oficina: "Subdirección Operativa",
          numero_documento: "DOC-ULTRA-CONF-09",
          name_clasificacion: "SECRETO",
          name_tipo_evento: "DOWNLOAD",
          doc_interno_externo: "exterior",
          size_archivo_mb: 120.0,
          hora_evento: 2,
        };
      } else if (tipoPrueba === "normal") {
        payload = {
          name_user: "Ana Gómez",
          id_user: 31547826,
          name_oficina: "Recursos Humanos",
          numero_documento: "CIRC-2026-012",
          name_clasificacion: "PUBLICO",
          name_tipo_evento: "READ",
          doc_interno_externo: "interno",
          size_archivo_mb: 0.8,
          hora_evento: 10,
        };
      }

      const fechaPrueba = new Date();
      fechaPrueba.setHours(payload.hora_evento, 0, 0, 0);
      const fechaLocal = [fechaPrueba.getFullYear(),
        String(fechaPrueba.getMonth() + 1).padStart(2, "0"),
        String(fechaPrueba.getDate()).padStart(2, "0")].join("-");
      await ingestarEventoAPI({
        ID_USER: payload.id_user,
        NAME_USER: payload.name_user,
        NAME_OFICINA: payload.name_oficina,
        NUMERO_DOCUMENTO: payload.numero_documento,
        ID_CLASIFICACION: tipoPrueba === "normal" ? 5 : 1,
        NAME_CLASIFICACION: tipoPrueba === "normal" ? "COMUN" : "SECRETO",
        ID_TIPO_EVENTO: tipoPrueba === "normal" ? 1 : 2,
        NAME_TIPO_EVENTO: tipoPrueba === "normal" ? "VISTA" : "DESCARGAR",
        DOC_INTERNO_EXTERNO: payload.doc_interno_externo,
        size_archivo_mb: payload.size_archivo_mb,
        FECHA_EVENTO: `${fechaLocal} ${String(payload.hora_evento).padStart(2, "0")}:00:00`,
      });

      // El backend difunde el evento por WebSocket y entra por el mismo flujo de correlación
      // en vivo; no se agrega un incidente sintético aquí (duplicaría el conteo).
      toast.success(`Evento de prueba '${tipoPrueba}' inyectado al motor de detección.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al inyectar evento");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleLimpiarFeed = async () => {
    setCargandoAccion(true);
    try {
      const res = await limpiarSimuladorAPI();
      setEventos([]);
      setUltimoEvento(null);
      setTelemetria(crearTelemetria());
      setEventoSeleccionado(null);
      setIncidentesPares({});
      eventosContadosRef.current = new Set();
      setRepetidosOmitidos(0);
      setSimuladorEstado((prev) => ({
        ...prev,
        eventos_emitidos: 0,
        anomalias_detectadas: 0,
        criticos_detectados: 0,
        indice_fila: 0,
        ultimo_evento: null,
      }));
      toast.info(res?.mensaje || "Feed de simulación limpiado. Dataset de entrenamiento intacto.");
    } catch (err) {
      console.warn("Aviso al limpiar registros temporales en BD:", err);
      toast.error(err.response?.data?.detail || "No se pudo limpiar la simulación.");
    } finally {
      setCargandoAccion(false);
    }
  };

  const handleUploadCSV = async (file) => {
    if (!file) return false;
    setIsUploadingCSV(true);
    try {
      const res = await cargarCSVSimuladorAPI({
        file,
        intervalo: intervaloConfig,
        autoIniciar: true,
      });
      eventosContadosRef.current = new Set(); // dataset nuevo: sus ID_EVENTO no son los del anterior
      toast.success(
        res.mensaje || res.message || `Dataset de testing '${file.name}' cargado e iniciado para inferencia online.`
      );
      if (res.simulador) {
        setSimuladorEstado((prev) => ({
          ...prev,
          ...res.simulador,
          archivo: res.simulador.archivo || res.archivo || file.name,
          archivo_nombre: file.name,
        }));
      } else {
        const st = await getEstadoSimuladorAPI();
        setSimuladorEstado((prev) => ({
          ...prev,
          ...st,
          archivo_nombre: file.name,
        }));
      }
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error subiendo dataset de testing");
      return false;
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const handleQuickFilter = (tipo) => {
    if (tipo === "critico") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "critico" ? "" : "critico",
      }));
    } else if (tipo === "alto") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "alto" ? "" : "alto",
      }));
    } else if (tipo === "anomalia") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "anomalia" ? "" : "anomalia",
      }));
    } else if (tipo === "exterior") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "exterior" ? "" : "exterior",
      }));
    } else if (tipo === "fuera_horario") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "fuera_horario" ? "" : "fuera_horario",
      }));
    } else {
      setFiltros({ nivel_riesgo: "", clasificacion: "", tipo_evento: "", busqueda: "" });
    }
  };

  return (
    <div className={styles.page}>
      {/* HEADER SECTION */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            <FaBolt style={{ color: "#38bdf8" }} />
            Motor de Detección y Neutralización de Fugas
          </h1>
          <p className={styles.subtitle}>
            Consola Operativa Online: Inferencia en Tiempo Real con Modelo Entrenado, Inteligencia Visual SOC y Neutralización Preventiva
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

      {/* BARRA DE MODOS DE VISTA & TOGGLE DE NEUTRALIZACIÓN AUTOMÁTICA */}
      <div className={styles.viewModeContainer}>
        <div className={styles.viewModeTabs}>

          
      {/* Banner de Cuentas Neutralizadas */}
      {totalBloqueados > 0 && (
        <div className={styles.alertBanner}>
          <FaShieldHalved className={styles.alertIcon} />
          <div>
            <strong>Centro de Contención Activo:</strong> Se registran{" "}
            <span className={styles.alertCount}>{totalBloqueados}</span> cuentas neutralizadas
            para asegurar la información clasificada.
          </div>
        </div>
      )}
          {/* ************************************************************************************************************************************** */}
          {/* <button
            type="button"
            className={`${styles.viewTabBtn} ${viewMode === "integral" ? styles.viewTabActive : ""}`}
            onClick={() => setViewMode("integral")}
          >
            <FaLayerGroup /> Vista Integral (Dual)
          </button>
          <button
            type="button"
            className={`${styles.viewTabBtn} ${viewMode === "streaming" ? styles.viewTabActive : ""}`}
            onClick={() => setViewMode("streaming")}
          >
            <FaTv /> Streaming en Vivo
          </button>
         */}
        
        </div>

        <div className={styles.autoNeutralizeContainer}>
          <label className={styles.autoNeutralizeLabel}>
            <FaShieldHalved style={{ color: autoNeutralize ? "#dc2626" : "#64748b" }} />
            Neutralización Automática:
          </label>
          <label className={styles.switchToggle}>
            <input
              type="checkbox"
              checked={autoNeutralize}
              onChange={(e) => {
                setAutoNeutralize(e.target.checked);
                if (e.target.checked) {
                  toast.error("⚡ Modo Automático ACTIVADO: Amenazas críticas serán neutralizadas al instante.");
                } else {
                  toast.info("Modo Supervisado: La neutralización requiere confirmación del operador.");
                }
              }}
            />
            <span className={styles.sliderRound} />
          </label>
          <span
            className={`${styles.autoStatusBadge} ${
              autoNeutralize ? styles.autoActiveBadge : styles.autoManualBadge
            }`}
          >
            {autoNeutralize ? "Zero-Touch (Activa)" : "Manual Supervisada"}
          </span>
        </div>
      </div>


      {/* KPI CARDS (En tiempo real) */}
      <KPICardsMonitoreo
        totalEventos={totalRecibidos}
        totalCriticos={totalCriticos}
        totalAnomalias={totalAnomalias}
        scorePromedio={scorePromedio}
        onFilterClick={handleQuickFilter}
      />

      {/* ============================================================== */}
      {/* SECCIÓN STREAMING: CONTROLES, RADAR Y TABLA EN VIVO (también en Integral) */}
      {/* ============================================================== */}
      {(viewMode === "streaming" || viewMode === "integral") && (
        <DeteccionAuth
          simuladorEstado={simuladorEstado}
          intervaloConfig={intervaloConfig}
          setIntervaloConfig={setIntervaloConfig}
          cargandoAccion={cargandoAccion}
          onIniciar={handleIniciar}
          onPausar={handlePausar}
          onReanudar={handleReanudar}
          onDetener={handleDetener}
          onInyectarPrueba={() => handleInyectarPrueba("critico")}
          onLimpiarFeed={handleLimpiarFeed}
          onUploadCSV={handleUploadCSV}
          isUploadingCSV={isUploadingCSV}
          ultimoEvento={ultimoEvento}
          onNeutralizarUsuario={handleNeutralizarUsuario}
          neutralizadosIds={neutralizadosIds}
          eventos={eventos}
          filtros={filtros}
          setFiltros={setFiltros}
          eventoSeleccionado={eventoSeleccionado}
          setEventoSeleccionado={setEventoSeleccionado}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
        />
      )}

      {/* ============================================================== */}
      {/* SECCIÓN ANALÍTICA SOC: LOS 4 GRÁFICOS DE INCIDENTESPAGE       */}
      {/* ============================================================== */}
      {(viewMode === "graficos" || viewMode === "integral") && (
        <div className={styles.chartsSection}>
          <div className={styles.chartsLiveHeader}>
            <div className={styles.chartsLiveHeaderTitle}>
              <FaChartLine style={{ color: "#38bdf8" }} />
              <span>Telemetría y Analítica en Tiempo Real (Inferencia Online)</span>
            </div>
            {totalRecibidos > 0 && (
              <span className={styles.chartsLiveIndicator}>
                <span className={styles.livePulseDot} />
                Sincronizado en vivo: {totalRecibidos} eventos procesados en streaming
                {repetidosOmitidos > 0 && ` · ${repetidosOmitidos} repetidos omitidos (el CSV reinició)`}
              </span>
            )}
          </div>

    

          <DashboardSOCAnalytics
            resumen={resumenEnVivo}
            tiempoReal
            filtros={filtrosSOC}
            setFiltros={setFiltrosSOC}
            setPage={setPageSOC}
            incidentesList={listaIncidentesEnVivo}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCION EXPEDIENTE FORENSE: TABLA DE INCIDENTES CORRELACIONADOS */}
      {/* ============================================================== */}
      {(viewMode === "incidentes" || viewMode === "integral") && (
        <div className={styles.forenseSection}>
          <div className={styles.chartsLiveHeader}>
            <div className={styles.chartsLiveHeaderTitle}>
              <FaFolderOpen style={{ color: "#7c3aed" }} />
              <span>Expediente Forense &mdash; Incidentes Correlacionados del Motor SOC</span>
            </div>
            {(incidentesForenseData?.total ?? 0) > 0 && (
              <span className={styles.forenseBadge}>
                {incidentesForenseData.total} incidentes en base de datos
              </span>
            )}
          </div>

          {/* Quick Filter Pills estilo Entrenamiento */}
          <div className={styles.filterPills}>
            <button
              className={`${styles.pill} ${!filtrosIncidentes.nivel_riesgo && !filtrosIncidentes.estado ? styles.pillActive : ""}`}
              onClick={() => handleQuickFilterIncidentes("todos")}
            >
              Todos los Incidentes
            </button>
            <button
              className={`${styles.pill} ${styles.pillCritico} ${
                filtrosIncidentes.nivel_riesgo === "critico" ? styles.pillActive : ""
              }`}
              onClick={() => handleQuickFilterIncidentes("critico")}
            >
              🚨 Solo Críticos
            </button>
            <button
              className={`${styles.pill} ${styles.pillAlto} ${
                filtrosIncidentes.nivel_riesgo === "alto" ? styles.pillActive : ""
              }`}
              onClick={() => handleQuickFilterIncidentes("alto")}
            >
              ⚠️ Solo Altos
            </button>
            <button
              className={`${styles.pill} ${filtrosIncidentes.estado === "abierto" ? styles.pillActive : ""}`}
              onClick={() => handleQuickFilterIncidentes("abierto")}
            >
              🔴 Estado Abierto
            </button>
          </div>

          {/* Tabla de Incidentes Forenses en Tiempo Real para Motor de Detección */}
          <TablaIncidentesMotor
            data={incidentesForenseData}
            incidentesEnVivo={incidentesEnVivo}
            neutralizadosIds={neutralizadosIds}
            onNeutralizarUsuario={handleNeutralizarUsuario}
            detalleBasePath="/eventos/motor-deteccion/incidente"
            page={pageIncidentes}
            setPage={setPageIncidentes}
            pageSize={pageSizeIncidentes}
            setPageSize={setPageSizeIncidentes}
            filtros={filtrosIncidentes}
            setFiltros={setFiltrosIncidentes}
            resumen={resumenEnVivo}
            isLoading={loadingForense}
          />
        </div>
      )}
    </div>
  );
}
