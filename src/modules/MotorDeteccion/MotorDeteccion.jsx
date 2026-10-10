import React, { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue } from "react";
import styles from "./motorDeteccion.module.css";
import KPICardsMonitoreo from "./componentes/kpi_cards_monitoreo/KPICardsMonitoreo";
import DeteccionAuth from "./deteccion_automatica/DeteccionAuth";
import {
  acumularEvento,
  combinarResumenSOC,
  correlacionarEnVivo,
  crearTelemetria,
  listarIncidentesEnVivo,
} from "./telemetria";
import { esAmenazaCritica, neutralizarAutomaticamente, scoreTotal, solicitarBloqueoVerificado } from "./neutralizacion";
import { useQueryClient } from "@tanstack/react-query";

// Componentes Analíticos SOC (compartidos con Entrenamiento)
import GraficoEvolucionRiesgos from "../entrenamiento/componentes/grafico_evolucion_riesgos/GraficoEvolucionRiesgos";
import GraficoTipoEvento from "../entrenamiento/componentes/grafico_tipo_evento/GraficoTipoEvento";
import DashboardSOCAnalytics from "../entrenamiento/componentes/dashboard_soc_analytics/DashboardSOCAnalytics";
import TablaIncidentesMotor from "./componentes/tabla_incidentes_motor/TablaIncidentesMotor";

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

// Pool de pruebas sintéticas: 5 casos Críticos (Score ≥ 0.75) y 3 casos Altos (Score 0.50 - 0.74)
// Todos los usuarios y documentos pertenecen a los datasets institucionales (dt_eventos.csv y registro_trazabilidad.csv)
// lo que garantiza la compatibilidad con las líneas base entrenadas y la correlación cruzada en tiempo real.
const CASOS_PRUEBA_INYECTAR = [
  // ── 5 CASOS CRÍTICOS (Score ≥ 0.75 / Alerta Directa y Contención) ──
  {
    nivel_esperado: "critico",
    name_user: "CARLOS ALBERTO",
    id_user: 20043477,
    name_oficina: "B-2 (SDI)",
    id_oficina: 2,
    id_documento: 152790,
    numero_documento: "109",
    id_tipo_documento: 2,
    id_clasificacion: 1,
    name_clasificacion: "SECRETO",
    id_tipo_evento: 2,
    name_tipo_evento: "DESCARGAR",
    doc_interno_externo: "exterior",
    size_archivo_mb: 120.0,
    hora_evento: 2,
  },
  {
    nivel_esperado: "critico",
    name_user: "ROBERTO CARLOS",
    id_user: 80137703,
    name_oficina: "A9 -Trafico ilicito de drogas y delitos conexos",
    id_oficina: 121,
    id_documento: 152791,
    numero_documento: "110",
    id_tipo_documento: 2,
    id_clasificacion: 1,
    name_clasificacion: "SECRETO",
    id_tipo_evento: 4,
    name_tipo_evento: "ELIMINAR",
    doc_interno_externo: "interior",
    size_archivo_mb: 18.5,
    hora_evento: 23,
  },
  {
    nivel_esperado: "critico",
    name_user: "ALEX",
    id_user: 10350450,
    name_oficina: "A1 -Crimen Organizado y Delincuencia Comun",
    id_oficina: 124,
    id_documento: 152794,
    numero_documento: "105",
    id_tipo_documento: 2,
    id_clasificacion: 1,
    name_clasificacion: "SECRETO",
    id_tipo_evento: 5,
    name_tipo_evento: "GUARDAR_COPIA",
    doc_interno_externo: "exterior",
    size_archivo_mb: 92.0,
    hora_evento: 1,
  },
  {
    nivel_esperado: "critico",
    name_user: "ARTURO",
    id_user: 23854735,
    name_oficina: "A10- Contaminacion al ambiente y su afectacion al des. disp.",
    id_oficina: 122,
    id_documento: 152799,
    numero_documento: "2122",
    id_tipo_documento: 2,
    id_clasificacion: 1,
    name_clasificacion: "SECRETO",
    id_tipo_evento: 2,
    name_tipo_evento: "DESCARGAR",
    doc_interno_externo: "exterior",
    size_archivo_mb: 185.0,
    hora_evento: 3,
  },
  {
    nivel_esperado: "critico",
    name_user: "JUAN PABLO",
    id_user: 18137788,
    name_oficina: "BRASIL",
    id_oficina: 137,
    id_documento: 152798,
    numero_documento: "2121",
    id_tipo_documento: 2,
    id_clasificacion: 1,
    name_clasificacion: "SECRETO",
    id_tipo_evento: 4,
    name_tipo_evento: "ELIMINAR",
    doc_interno_externo: "exterior",
    size_archivo_mb: 5.0,
    hora_evento: 4,
  },

  // ── 3 CASOS ALTOS (Score 0.50 - 0.74 / Amenaza sin Alerta Directa) ──
  {
    nivel_esperado: "alto",
    name_user: "FREDDY MAX",
    id_user: 10326966,
    name_oficina: "A10- Contaminacion al ambiente y su afectacion al des. disp.",
    id_oficina: 122,
    id_documento: 152797,
    numero_documento: "21",
    id_tipo_documento: 6,
    id_clasificacion: 2,
    name_clasificacion: "RESERVADO",
    id_tipo_evento: 2,
    name_tipo_evento: "DESCARGAR",
    doc_interno_externo: "exterior",
    size_archivo_mb: 52.0,
    hora_evento: 21,
  },
  {
    nivel_esperado: "alto",
    name_user: "ANTONIO",
    id_user: 43500589,
    name_oficina: "A7 - Conflictividad Social",
    id_oficina: 125,
    id_documento: 152803,
    numero_documento: "21",
    id_tipo_documento: 6,
    id_clasificacion: 2,
    name_clasificacion: "RESERVADO",
    id_tipo_evento: 5,
    name_tipo_evento: "GUARDAR_COPIA",
    doc_interno_externo: "interior",
    size_archivo_mb: 40.0,
    hora_evento: 22,
  },
  {
    nivel_esperado: "alto",
    name_user: "ANDRES MOISES",
    id_user: 2601745,
    name_oficina: "JEFE DE FRENTE INTERNO",
    id_oficina: 147,
    id_documento: 152816,
    numero_documento: "22",
    id_tipo_documento: 6,
    id_clasificacion: 2,
    name_clasificacion: "RESERVADO",
    id_tipo_evento: 2,
    name_tipo_evento: "DESCARGAR",
    doc_interno_externo: "exterior",
    size_archivo_mb: 48.0,
    hora_evento: 20,
  },
];

export default function MotorDeteccion() {
  const queryClient = useQueryClient();
  // Modos de Vista: "integral" (ambos), "streaming" (solo feed/simulador), "graficos" (solo analítica SOC)
  const [viewMode] = useState("integral");

  // Neutralización Automática vs Supervisada. Arranca en automático: una amenaza crítica
  // (score ≥ 0.75) bloquea la cuenta sin esperar al operador; el interruptor permite pasar a supervisado.
  const [autoNeutralize, setAutoNeutralize] = useState(true);
  const autoNeutralizeRef = useRef(true);
  const [bloqueosLocales, setBloqueosLocales] = useState([]);
  const neutralizacionesPendientesRef = useRef(new Set());
  const neutralizadosRef = useRef(new Set());

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

  const { data: resumenSOC } = useResumenSOC();
  const { data: alertasBloqueo, dataUpdatedAt: alertasActualizadasEn } = useAlertasBloqueados();

  // Estado para Expediente Forense (TablaIncidentes en Motor de Detección)
  // Correlación en vivo: un incidente por par (documento, usuario) que se actualiza con cada evento.
  const [incidentesPares, setIncidentesPares] = React.useState({});
  const incidentesEnVivo = useMemo(() => listarIncidentesEnVivo(incidentesPares), [incidentesPares]);
  // IDs de evento ya contados: si el CSV vuelve a empezar (bucle / reinicio) el evento repetido
  // se muestra en el feed pero no se vuelve a sumar a gráficos, KPIs ni incidentes.
  const eventosContadosRef = useRef(new Set());
  const ultimoIndiceInyectadoRef = useRef(-1);
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

  const idsBloqueadosConfirmados = useMemo(() => [...new Set([
    // La confirmación local cubre la espera del siguiente snapshot del servidor.
    ...bloqueosLocales.filter((bloqueo) => bloqueo.confirmadoEn >= alertasActualizadasEn)
      .map((bloqueo) => bloqueo.id),
    ...(Array.isArray(alertasBloqueo)
      ? alertasBloqueo.filter((alerta) => alerta.confirmacion_bloqueo === true && alerta.id_user != null)
        .map((alerta) => String(alerta.id_user))
      : []),
  ])], [alertasBloqueo, alertasActualizadasEn, bloqueosLocales]);
  const totalBloqueados = idsBloqueadosConfirmados.length;
  // Últimos usuarios bloqueados (confirmados por el servidor) para la alerta del banner
  const ultimosBloqueados = useMemo(
    () => (Array.isArray(alertasBloqueo) ? alertasBloqueo : [])
      .filter((alerta) => alerta.confirmacion_bloqueo === true && alerta.id_user != null)
      .filter((alerta, i, lista) => lista.findIndex((a) => String(a.id_user) === String(alerta.id_user)) === i)
      .slice(0, 3),
    [alertasBloqueo]
  );

  useEffect(() => {
    neutralizadosRef.current = new Set(idsBloqueadosConfirmados);
  }, [idsBloqueadosConfirmados]);

  // Los gráficos leen una versión diferida: React prioriza el feed/KPIs y repinta
  // las gráficas en cuanto puede, así una ráfaga de eventos no las congela ni las salta.
  const telemetriaGraficos = useDeferredValue(telemetria);
  const neutralizadosGraficos = useDeferredValue(idsBloqueadosConfirmados);
  const resumenEnVivo = useMemo(
    () => combinarResumenSOC(resumenSOC, telemetriaGraficos, neutralizadosGraficos),
    [resumenSOC, telemetriaGraficos, neutralizadosGraficos]
  );
  // Lista combinada de incidentes para el modal y tabla de analytics:
  // los correlacionados en vivo (1 por documento+usuario) primero, luego los persistidos.
  const listaIncidentesEnVivo = useMemo(
    () => [...incidentesEnVivo, ...(incidentesForenseData?.incidentes || [])],
    [incidentesForenseData?.incidentes, incidentesEnVivo]
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
    const aviso = toast.loading(`Verificando el bloqueo de ${userName}…`);

    try {
      const resultado = await solicitarBloqueoVerificado(evento, motivo, postNeutralizarUsuario);
      neutralizadosRef.current.add(userKey);
      if (!montadoRef.current) return;
      setBloqueosLocales((prev) => [
        ...prev.filter((bloqueo) => bloqueo.id !== userKey),
        { id: userKey, confirmadoEn: Date.now() },
      ]);
      queryClient.invalidateQueries({ queryKey: ["alertas_bloqueados"] });
      const scoreBloqueo = Number(resultado?.score_correlacion);
      toast.error(`🔒 Usuario bloqueado: ${userName} (DNI ${userKey})`, {
        id: aviso,
        duration: 8000,
        description: `Cuenta neutralizada automáticamente y confirmada por el servidor${
          Number.isFinite(scoreBloqueo) ? ` · score total ${Math.round(scoreBloqueo * 100)}%` : ""
        }.`,
      });
    } catch (err) {
      console.error("Error neutralizando:", err);
      if (montadoRef.current) {
        toast.error(err.response?.data?.detail || err.message || `No se pudo neutralizar a ${userName}.`, { id: aviso, duration: 5000 });
      }
    } finally {
      neutralizacionesPendientesRef.current.delete(userKey);
      if (!montadoRef.current) toast.dismiss(aviso);
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

              // Criterio institucional según constantes.py: UMBRAL_CRITICO = 0.75, aplicado al
              // evento o al score total de la correlación del par (el que muestra la tabla).
              if (esAmenazaCritica(ev, correlacion)) {
                const total = scoreTotal(correlacion);
                toast.error(
                  `Amenaza crítica #${ev.id_evento}: ${ev.name_user} — ${ev.name_tipo_evento || "Actividad"} (${ev.name_clasificacion || "Documento"})${total !== null ? ` · score total ${Math.round(total * 100)}%` : ""}. ${autoNeutralizeRef.current ? "Bloqueando la cuenta…" : "Pendiente de decisión del operador."}`
                );
                neutralizarAutomaticamente(ev, correlacion, autoNeutralizeRef.current, handleNeutralizarUsuario);
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

  const handleInyectarPrueba = async () => {
    setCargandoAccion(true);
    try {
      // Selección aleatoria entre los 8 casos (5 críticos y 3 de nivel alto)
      // Evita repetir el mismo caso de manera consecutiva
      let indice = Math.floor(Math.random() * CASOS_PRUEBA_INYECTAR.length);
      if (CASOS_PRUEBA_INYECTAR.length > 1 && indice === ultimoIndiceInyectadoRef.current) {
        indice =
          (indice + 1 + Math.floor(Math.random() * (CASOS_PRUEBA_INYECTAR.length - 1))) %
          CASOS_PRUEBA_INYECTAR.length;
      }
      ultimoIndiceInyectadoRef.current = indice;
      const caso = CASOS_PRUEBA_INYECTAR[indice];

      const fechaPrueba = new Date();
      fechaPrueba.setHours(caso.hora_evento, 0, 0, 0);
      const fechaLocal = [
        fechaPrueba.getFullYear(),
        String(fechaPrueba.getMonth() + 1).padStart(2, "0"),
        String(fechaPrueba.getDate()).padStart(2, "0"),
      ].join("-");

      // ID de evento único incremental para que la telemetría y el feed en vivo lo registren individualmente
      const idEventoGenerado = (Math.floor(Date.now() / 1000) % 900000) + 100000;

      await ingestarEventoAPI({
        ID_EVENTO: idEventoGenerado,
        ID_USER: caso.id_user,
        NAME_USER: caso.name_user,
        ID_OFICINA: caso.id_oficina,
        NAME_OFICINA: caso.name_oficina,
        ID_DOCUMENTO: caso.id_documento,
        NUMERO_DOCUMENTO: caso.numero_documento,
        ID_TIPO_DOCUMENTO: caso.id_tipo_documento,
        ID_CLASIFICACION: caso.id_clasificacion,
        NAME_CLASIFICACION: caso.name_clasificacion,
        ID_TIPO_EVENTO: caso.id_tipo_evento,
        NAME_TIPO_EVENTO: caso.name_tipo_evento,
        DOC_INTERNO_EXTERNO: caso.doc_interno_externo,
        size_archivo_mb: caso.size_archivo_mb,
        FECHA_EVENTO: `${fechaLocal} ${String(caso.hora_evento).padStart(2, "0")}:00:00`,
      });

      const esCritico = caso.nivel_esperado === "critico";
      toast.success(
        `Evento inyectado (${esCritico ? "🚨 Crítico" : "⚠️ Alto"}): ${caso.name_user} — ${caso.name_tipo_evento} ${caso.name_clasificacion} (${caso.numero_documento})`
      );
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
      // El backend borró los bloqueos de la simulación: se vacía el estado local y la lista de
      // alertas para que el banner "Centro de Contención Activo" se oculte de inmediato.
      setBloqueosLocales([]);
      neutralizadosRef.current = new Set();
      neutralizacionesPendientesRef.current = new Set();
      queryClient.setQueryData(["alertas_bloqueados"], []);
      queryClient.invalidateQueries({ queryKey: ["alertas_bloqueados"] });
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

          
      {/* Banner de Cuentas Neutralizadas: alerta de usuario bloqueado */}
      {totalBloqueados > 0 && (
        <div className={styles.alertBanner} role="alert">
          <FaShieldHalved className={styles.alertIcon} />
          <div>
            <strong>Centro de Contención Activo:</strong> Se registran{" "}
            <span className={styles.alertCount}>{totalBloqueados}</span> cuentas neutralizadas
            para asegurar la información clasificada.
            {ultimosBloqueados.length > 0 && (
              <div className={styles.alertUsuarios}>
                {ultimosBloqueados.map((alerta) => (
                  <span key={alerta.alerta_id ?? alerta.id_user} className={styles.alertUsuario}>
                    <FaBan aria-hidden="true" /> {alerta.nombre_usuario || "Usuario"} (DNI {alerta.id_user}) ·
                    score total {Math.round(Number(alerta.score_correlacion || 0) * 100)}%
                    {alerta.fecha_registro && ` · ${new Date(alerta.fecha_registro).toLocaleTimeString()}`}
                  </span>
                ))}
              </div>
            )}
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
              aria-label="Activar neutralización automática"
              checked={autoNeutralize}
              onChange={(e) => {
                autoNeutralizeRef.current = e.target.checked;
                setAutoNeutralize(e.target.checked);
                if (e.target.checked) {
                  toast.info("Modo automático activado: se solicitará al servidor el bloqueo de las amenazas críticas.");
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
          onInyectarPrueba={handleInyectarPrueba}
          onLimpiarFeed={handleLimpiarFeed}
          onUploadCSV={handleUploadCSV}
          isUploadingCSV={isUploadingCSV}
          ultimoEvento={ultimoEvento}
          onNeutralizarUsuario={handleNeutralizarUsuario}
          neutralizadosIds={idsBloqueadosConfirmados}
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

    

          {/* Los clics en los gráficos (clasificación, mes, usuario, documento) filtran la
              tabla del Expediente Forense: comparten su estado de filtros y paginación. */}
          <DashboardSOCAnalytics
            resumen={resumenEnVivo}
            tiempoReal
            filtros={filtrosIncidentes}
            setFiltros={setFiltrosIncidentes}
            setPage={setPageIncidentes}
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
            neutralizadosIds={idsBloqueadosConfirmados}
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
