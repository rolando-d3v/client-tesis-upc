import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import styles from "./motorDeteccion.module.css";
import KPICardsMonitoreo from "./componentes/KPICardsMonitoreo";
import ControlSimulador from "./componentes/ControlSimulador";
import BannerUltimoEvento from "./componentes/BannerUltimoEvento";
import TablaEventosEnVivo from "./componentes/TablaEventosEnVivo";
import ModalInspeccionEvento from "./componentes/ModalInspeccionEvento";

// Componentes Analíticos SOC (compartidos con Entrenamiento)
import GraficoEvolucionRiesgos from "../../../entrenamiento/componentes/GraficoEvolucionRiesgos";
import GraficoTipoEvento from "../../../entrenamiento/componentes/GraficoTipoEvento";
import GraficoEstadoGestion from "../../../entrenamiento/componentes/GraficoEstadoGestion";
import DashboardSOCAnalytics from "../../../entrenamiento/componentes/DashboardSOCAnalytics";

import { API_MACHINE } from "../../../../api/apiRestMachine";
import {
  iniciarSimuladorAPI,
  pausarSimuladorAPI,
  reanudarSimuladorAPI,
  detenerSimuladorAPI,
  getEstadoSimuladorAPI,
  ingestarEventoAPI,
  cargarCSVSimuladorAPI,
  limpiarSimuladorAPI,
} from "../../../../api/apiEventos";
import {
  useResumenSOC,
  useIncidentes,
  useAlertasBloqueados,
  postNeutralizarUsuario,
} from "../../../../api/apiCorrelacion";
import { toast } from "sonner";
import {
  FaBolt,
  FaArrowRotateRight,
  FaTv,
  FaChartLine,
  FaLayerGroup,
  FaShieldHalved,
  FaBan,
} from "react-icons/fa6";

export default function MotorDeteccion() {
  // Modos de Vista: "integral" (ambos), "streaming" (solo feed/simulador), "graficos" (solo analítica SOC)
  const [viewMode, setViewMode] = useState("integral");

  // Neutralización Automática vs Supervisada
  const [autoNeutralize, setAutoNeutralize] = useState(false);
  const autoNeutralizeRef = useRef(false);
  const [neutralizadosIds, setNeutralizadosIds] = useState([]);

  useEffect(() => {
    autoNeutralizeRef.current = autoNeutralize;
  }, [autoNeutralize]);

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

  const totalBloqueados =
    (Array.isArray(alertasBloqueo)
      ? alertasBloqueo.length
      : (alertasBloqueo?.total_cuentas_bloqueadas || 0)) + neutralizadosIds.length;

  // ==============================================================
  // AGREGACIÓN EN TIEMPO REAL: SINCRONIZACIÓN DE GRÁFICOS SOC
  // ==============================================================
  const MESES_MAP = {
    "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
    "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
    "09": "Set", "10": "Oct", "11": "Nov", "12": "Dic",
  };

  const DEFAULT_TIPOS = [
    { id: "VISTA", nombre: "VISTA", sub: "Lectura / visualización auditable", cantidad: 0, color: "#64748b", peso_accion: 1.0, nivel: "bajo" },
    { id: "DESCARGAR", nombre: "DESCARGAR", sub: "Descarga y tenencia de copia local", cantidad: 0, color: "#eab308", peso_accion: 2.0, nivel: "alto" },
    { id: "EDITAR", nombre: "EDITAR", sub: "Modificación o alteración de documento", cantidad: 0, color: "#3b82f6", peso_accion: 2.0, nivel: "medio" },
    { id: "ELIMINAR", nombre: "ELIMINAR", sub: "Destrucción / sabotaje de registro (Riesgo máximo)", cantidad: 0, color: "#ef4444", peso_accion: 3.0, nivel: "critico" },
    { id: "GUARDAR_COPIA", nombre: "GUARDAR_COPIA", sub: "Duplicación de archivo / riesgo de fuga", cantidad: 0, color: "#f97316", peso_accion: 2.5, nivel: "alto" },
  ];

  const DEFAULT_MESES_VACIOS = [
    { key: "2026-01", label: "Ene", mes: "Ene", mes_completo: "Ene 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-02", label: "Feb", mes: "Feb", mes_completo: "Feb 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-03", label: "Mar", mes: "Mar", mes_completo: "Mar 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-04", label: "Abr", mes: "Abr", mes_completo: "Abr 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-05", label: "May", mes: "May", mes_completo: "May 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-06", label: "Jun", mes: "Jun", mes_completo: "Jun 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-07", label: "Jul", mes: "Jul", mes_completo: "Jul 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-08", label: "Ago", mes: "Ago", mes_completo: "Ago 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-09", label: "Set", mes: "Set", mes_completo: "Set 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-10", label: "Oct", mes: "Oct", mes_completo: "Oct 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-11", label: "Nov", mes: "Nov", mes_completo: "Nov 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
    { key: "2026-12", label: "Dic", mes: "Dic", mes_completo: "Dic 2026", critico: 0, alto: 0, medio: 0, bajo: 0, total: 0 },
  ];

  const parseFechaEvento = (fechaRaw) => {
    if (!fechaRaw || fechaRaw === "-") {
      const d = new Date();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const mesNombre = MESES_MAP[m] || "Oct";
      return {
        mesKey: m,
        mesNombre,
        diaKey: d.toISOString().split("T")[0],
        diaLabel: `${d.getDate()} ${mesNombre.toLowerCase()}`,
        year: d.getFullYear(),
      };
    }

    const str = String(fechaRaw).trim();
    if (str.includes("/")) {
      const [datePart] = str.split(" ");
      const parts = datePart.split("/");
      if (parts.length === 3) {
        let dia, mes, anio;
        if (parts[0].length === 4) {
          anio = parts[0];
          mes = String(parts[1]).padStart(2, "0");
          dia = String(parts[2]).padStart(2, "0");
        } else {
          dia = String(parts[0]).padStart(2, "0");
          mes = String(parts[1]).padStart(2, "0");
          anio = parts[2];
        }
        const mesNombre = MESES_MAP[mes] || "Ene";
        return {
          mesKey: mes,
          mesNombre,
          diaKey: `${anio}-${mes}-${dia}`,
          diaLabel: `${parseInt(dia, 10)} ${mesNombre.toLowerCase()}`,
          year: parseInt(anio, 10) || 2026,
        };
      }
    }

    if (str.includes("-")) {
      const [datePart] = str.split("T")[0].split(" ");
      const parts = datePart.split("-");
      if (parts.length === 3) {
        let dia, mes, anio;
        if (parts[0].length === 4) {
          anio = parts[0];
          mes = String(parts[1]).padStart(2, "0");
          dia = String(parts[2]).padStart(2, "0");
        } else {
          dia = String(parts[0]).padStart(2, "0");
          mes = String(parts[1]).padStart(2, "0");
          anio = parts[2];
        }
        const mesNombre = MESES_MAP[mes] || "Ene";
        return {
          mesKey: mes,
          mesNombre,
          diaKey: `${anio}-${mes}-${dia}`,
          diaLabel: `${parseInt(dia, 10)} ${mesNombre.toLowerCase()}`,
          year: parseInt(anio, 10) || 2026,
        };
      }
    }

    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const mesNombre = MESES_MAP[m] || "Oct";
    return {
      mesKey: m,
      mesNombre,
      diaKey: d.toISOString().split("T")[0],
      diaLabel: `${d.getDate()} ${mesNombre.toLowerCase()}`,
      year: d.getFullYear(),
    };
  };

  const normalizarTipoEvento = (tipoRaw, idTipo) => {
    if (Number(idTipo) === 1) return "VISTA";
    if (Number(idTipo) === 2) return "DESCARGAR";
    if (Number(idTipo) === 3) return "EDITAR";
    if (Number(idTipo) === 4) return "ELIMINAR";
    if (Number(idTipo) === 5) return "GUARDAR_COPIA";
    const raw = String(tipoRaw || "").trim().toUpperCase();
    if (raw.includes("DESCARG") || raw.includes("DOWN")) return "DESCARGAR";
    if (raw.includes("COPIA") || raw.includes("COPY")) return "GUARDAR_COPIA";
    if (raw.includes("EDIT")) return "EDITAR";
    if (raw.includes("ELIMIN") || raw.includes("DELET") || raw.includes("BORR")) return "ELIMINAR";
    if (raw.includes("VIST") || raw.includes("READ") || raw.includes("LECT")) return "VISTA";
    return "VISTA";
  };

  // Resumen Dinámico en Tiempo Real que integra streaming y telemetría histórica
  const resumenEnVivo = useMemo(() => {
    // 1. Clonar estructura base
    const baseTipos = (resumenSOC?.tipos_eventos && resumenSOC.tipos_eventos.length > 0)
      ? resumenSOC.tipos_eventos.map((t) => ({ ...t }))
      : DEFAULT_TIPOS.map((t) => ({ ...t }));

    const baseEvolucionMensual = (resumenSOC?.evolucion_mensual && resumenSOC.evolucion_mensual.length > 0)
      ? resumenSOC.evolucion_mensual.map((m) => ({ ...m }))
      : DEFAULT_MESES_VACIOS.map((m) => ({ ...m }));

    const baseEvolucionDiaria = (resumenSOC?.evolucion_diaria && resumenSOC.evolucion_diaria.length > 0)
      ? resumenSOC.evolucion_diaria.map((d) => ({ ...d }))
      : [];

    const basePorRiesgo = {
      critico: Number(resumenSOC?.por_nivel_riesgo?.critico || 0),
      alto: Number(resumenSOC?.por_nivel_riesgo?.alto || 0),
      medio: Number(resumenSOC?.por_nivel_riesgo?.medio || 0),
      bajo: Number(resumenSOC?.por_nivel_riesgo?.bajo || 0),
    };

    const basePorEstado = {
      abierto: Number(resumenSOC?.por_estado?.abierto || 0),
      en_investigacion: Number(resumenSOC?.por_estado?.en_investigacion || 0),
      contenido: Number(resumenSOC?.por_estado?.contenido || 0),
      mitigado: Number(resumenSOC?.por_estado?.mitigado || 0),
      falso_positivo: Number(resumenSOC?.por_estado?.falso_positivo || 0),
    };

    const basePorClasif = {
      SECRETO: Number(resumenSOC?.por_clasificacion?.SECRETO || 0),
      RESERVADO: Number(resumenSOC?.por_clasificacion?.RESERVADO || 0),
      CONFIDENCIAL: Number(resumenSOC?.por_clasificacion?.CONFIDENCIAL || 0),
      COMUN: Number(resumenSOC?.por_clasificacion?.COMUN || 0),
      ...(resumenSOC?.por_clasificacion || {}),
    };

    const baseTopDocs = Array.isArray(resumenSOC?.top_documentos)
      ? [...resumenSOC.top_documentos]
      : [];

    const baseTopUsers = Array.isArray(resumenSOC?.top_usuarios)
      ? [...resumenSOC.top_usuarios]
      : [];

    const baseTiposPorMes = resumenSOC?.tipos_eventos_por_mes
      ? JSON.parse(JSON.stringify(resumenSOC.tipos_eventos_por_mes))
      : {};

    // 2. Acumular eventos vivos generados por la simulación o ingesta
    eventos.forEach((ev) => {
      // --- A. Tipo de Evento ---
      const tipoNormalizado = normalizarTipoEvento(
        ev.name_tipo_evento || ev.NAME_TIPO_EVENTO || ev.tipo_evento || ev.tipo,
        ev.id_tipo_evento || ev.ID_TIPO_EVENTO
      );

      const tipoObj = baseTipos.find((t) => t.id === tipoNormalizado || t.nombre === tipoNormalizado);
      if (tipoObj) {
        tipoObj.cantidad = (tipoObj.cantidad || 0) + 1;
      }

      // --- B. Fecha, Mes y Día ---
      const fechaRaw = ev.fecha_evento || ev.FECHA_EVENTO || ev.fecha;
      const { mesKey, mesNombre, diaKey, diaLabel } = parseFechaEvento(fechaRaw);

      if (!baseTiposPorMes[mesKey]) {
        baseTiposPorMes[mesKey] = DEFAULT_TIPOS.map((d) => ({ ...d, cantidad: 0 }));
      }
      const evTipoMes = baseTiposPorMes[mesKey].find((t) => t.id === tipoNormalizado || t.nombre === tipoNormalizado);
      if (evTipoMes) {
        evTipoMes.cantidad = (evTipoMes.cantidad || 0) + 1;
      }

      // --- C. Nivel de Riesgo ---
      const nivel = String(ev.nivel_riesgo || ev.NIVEL_RIESGO || "bajo").toLowerCase();
      if (basePorRiesgo[nivel] !== undefined) {
        basePorRiesgo[nivel] += 1;
      }

      // Actualizar Evolución Mensual
      let mesObj = baseEvolucionMensual.find(
        (m) => m.label?.toLowerCase() === mesNombre.toLowerCase() || m.mes?.toLowerCase() === mesNombre.toLowerCase()
      );
      if (mesObj) {
        if (mesObj[nivel] !== undefined) {
          mesObj[nivel] = (mesObj[nivel] || 0) + 1;
        }
        mesObj.total = (mesObj.total || 0) + 1;
      } else {
        baseEvolucionMensual.push({
          key: `2026-${mesKey}`,
          label: mesNombre,
          mes: mesNombre,
          mes_completo: `${mesNombre} 2026`,
          critico: nivel === "critico" ? 1 : 0,
          alto: nivel === "alto" ? 1 : 0,
          medio: nivel === "medio" ? 1 : 0,
          bajo: nivel === "bajo" ? 1 : 0,
          total: 1,
        });
      }

      // Actualizar Evolución Diaria
      let diaObj = baseEvolucionDiaria.find((d) => d.key === diaKey || d.label === diaLabel);
      if (diaObj) {
        if (diaObj[nivel] !== undefined) {
          diaObj[nivel] = (diaObj[nivel] || 0) + 1;
        }
        diaObj.total = (diaObj.total || 0) + 1;
      } else {
        baseEvolucionDiaria.push({
          key: diaKey,
          label: diaLabel,
          dia: diaLabel,
          critico: nivel === "critico" ? 1 : 0,
          alto: nivel === "alto" ? 1 : 0,
          medio: nivel === "medio" ? 1 : 0,
          bajo: nivel === "bajo" ? 1 : 0,
          total: 1,
        });
      }

      // --- D. Estado de Gestión (Contención y Neutralización) ---
      const userIdStr = String(ev.id_user || ev.name_user);
      const isNeutralizado = neutralizadosIds.includes(userIdStr);
      if (ev.nivel_riesgo === "critico" || ev.es_anomalia) {
        if (isNeutralizado) {
          basePorEstado.contenido += 1;
        } else {
          basePorEstado.abierto += 1;
        }
      }

      // --- E. Clasificación de Documentos ---
      const clasifNorm = String(ev.name_clasificacion || "COMUN").trim().toUpperCase();
      basePorClasif[clasifNorm] = (basePorClasif[clasifNorm] || 0) + 1;

      // --- F. Top Documentos ---
      if (ev.id_documento && (ev.nivel_riesgo === "critico" || ev.es_anomalia)) {
        const docExistente = baseTopDocs.find((d) => d.id_documento === ev.id_documento);
        if (docExistente) {
          docExistente.incidentes = (docExistente.incidentes || 0) + 1;
          docExistente.max_score = Math.max(Number(docExistente.max_score || 0), Number(ev.score_final || 0));
        } else {
          baseTopDocs.unshift({
            id_documento: ev.id_documento,
            numero_documento: ev.numero_documento || `DOC-${ev.id_documento}`,
            clasificacion_doc: ev.name_clasificacion || "COMUN",
            incidentes: 1,
            max_score: Number(ev.score_final || 0),
          });
        }
      }

      // --- G. Top Usuarios ---
      if (ev.id_user && (ev.nivel_riesgo === "critico" || ev.es_anomalia)) {
        const userExistente = baseTopUsers.find((u) => u.id_user === ev.id_user);
        if (userExistente) {
          userExistente.incidentes = (userExistente.incidentes || 0) + 1;
          userExistente.max_score = Math.max(Number(userExistente.max_score || 0), Number(ev.score_final || 0));
        } else {
          baseTopUsers.unshift({
            id_user: ev.id_user,
            nombre_usuario: ev.name_user || `Usuario ${ev.id_user}`,
            incidentes: 1,
            max_score: Number(ev.score_final || 0),
          });
        }
      }
    });

    const totalAnalizados = Number(resumenSOC?.total_eventos_analizados || 0) + eventos.length;
    const totalCriticosLive = eventos.filter((e) => e.nivel_riesgo === "critico" || e.es_anomalia).length;
    const totalIncidentes = Number(resumenSOC?.total_incidentes || 0) + totalCriticosLive;
    const resueltos = (basePorEstado.mitigado || 0) + (basePorEstado.contenido || 0);
    const tasaContencion = totalIncidentes > 0 ? Number(((resueltos / totalIncidentes) * 100).toFixed(1)) : 0.0;

    return {
      ...resumenSOC,
      total_incidentes: totalIncidentes,
      total_eventos_analizados: totalAnalizados,
      por_nivel_riesgo: basePorRiesgo,
      por_riesgo: basePorRiesgo,
      por_estado: basePorEstado,
      tasa_contencion_porcentaje: tasaContencion,
      tipos_eventos: baseTipos,
      tipos_eventos_por_mes: baseTiposPorMes,
      evolucion_mensual: baseEvolucionMensual,
      evolucion_diaria: baseEvolucionDiaria,
      por_clasificacion: basePorClasif,
      top_documentos: baseTopDocs.slice(0, 10),
      top_usuarios: baseTopUsers.slice(0, 10),
    };
  }, [resumenSOC, eventos, neutralizadosIds]);

  // Lista combinada de incidentes para el modal y tabla de analytics
  const listaIncidentesEnVivo = useMemo(() => {
    const baseList = incidentesData?.incidentes || [];
    const liveInc = eventos
      .filter((e) => e.nivel_riesgo === "critico" || e.es_anomalia)
      .map((e, idx) => ({
        id: e.id_evento || `live-${idx}`,
        codigo_incidente: `INC-LIVE-${e.id_evento || idx}`,
        id_user: e.id_user,
        nombre_usuario: e.name_user,
        name_role: e.name_role || "USER",
        id_documento: e.id_documento,
        numero_documento: e.numero_documento,
        clasificacion_doc: e.name_clasificacion || "COMUN",
        nivel_riesgo: e.nivel_riesgo || "critico",
        score_correlacion: e.score_final,
        estado: neutralizadosIds.includes(String(e.id_user || e.name_user)) ? "contenido" : "abierto",
        fecha_deteccion: e.fecha_evento || new Date().toISOString(),
        name_tipo_evento: e.name_tipo_evento || "DESCARGAR",
        tipo_evento: e.name_tipo_evento || "DESCARGAR",
      }));
    return [...liveInc, ...baseList];
  }, [incidentesData?.incidentes, eventos, neutralizadosIds]);

  // Ejecución de Neutralización Preventiva (Manual o Automática)
  const handleNeutralizarUsuario = async (evento, motivoCustom = null) => {
    const userId = evento.id_user || evento.user_id || 1;
    const userName = evento.name_user || evento.nombre || "Usuario";
    const motivo =
      motivoCustom ||
      `Neutralización inmediata en vivo: Detección crítica en evento #${evento.id_evento} (${evento.name_clasificacion || "Documento"}) por ${userName}`;

    try {
      await postNeutralizarUsuario({
        incidente_id: evento.id_evento || 1,
        id_user: userId,
        nombre_usuario: userName,
        motivo,
        responsable: "MOTOR_DETECCION_REALTIME",
      });
      setNeutralizadosIds((prev) => [...new Set([...prev, String(userId), userName])]);
      toast.success(`🛡️ Usuario ${userName} neutralizado y cuenta bloqueada en tiempo real.`);
    } catch (err) {
      console.error("Error neutralizando:", err);
      setNeutralizadosIds((prev) => [...new Set([...prev, String(userId), userName])]);
      toast.warning(`Acción de contención aplicada para ${userName}.`);
    }
  };

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

              // Neutralización Automática en tiempo real si está activada
              if (autoNeutralizeRef.current) {
                handleNeutralizarUsuario(
                  ev,
                  "Neutralización automática: Amenaza crítica detectada por el motor de inferencia"
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
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
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
        id_user: 104,
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
          id_user: 108,
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
          id_user: 102,
          name_oficina: "Recursos Humanos",
          numero_documento: "CIRC-2026-012",
          name_clasificacion: "PUBLICO",
          name_tipo_evento: "READ",
          doc_interno_externo: "interno",
          size_archivo_mb: 0.8,
          hora_evento: 10,
        };
      }

      await ingestarEventoAPI(payload);
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
      setEventos([]);
      setUltimoEvento(null);
      const res = await limpiarSimuladorAPI();
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
      setEventos([]);
      setUltimoEvento(null);
      toast.info("Feed en memoria limpiado. Dataset de entrenamiento intacto.");
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
          <button
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
          <button
            type="button"
            className={`${styles.viewTabBtn} ${viewMode === "graficos" ? styles.viewTabActive : ""}`}
            onClick={() => setViewMode("graficos")}
          >
            <FaChartLine /> Inteligencia Analítica SOC
          </button>
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

      {/* Banner de Cuentas Neutralizadas */}
      {totalBloqueados > 0 && (
        <div className={styles.alertBanner}>
          <FaShieldHalved className={styles.alertIcon} />
          <div>
            <strong>Centro de Contención Activo:</strong> Se registran{" "}
            <span className={styles.alertCount}>{totalBloqueados}</span> cuentas neutralizadas
            preventivamente para salvaguardar la información clasificada.
          </div>
        </div>
      )}

      {/* KPI CARDS (En tiempo real) */}
      <KPICardsMonitoreo
        totalEventos={totalRecibidos}
        totalCriticos={totalCriticos}
        totalAnomalias={totalAnomalias}
        scorePromedio={scorePromedio}
        onFilterClick={handleQuickFilter}
      />

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
            {eventos.length > 0 && (
              <span className={styles.chartsLiveIndicator}>
                <span className={styles.livePulseDot} />
                Sincronizado en vivo: {eventos.length} eventos procesados en streaming
              </span>
            )}
          </div>

          <div className={styles.chartsGrid}>
            <div className={styles.chartMain}>
              <GraficoEvolucionRiesgos
                resumen={resumenEnVivo}
                filtros={filtrosSOC}
                setFiltros={setFiltrosSOC}
                setPage={setPageSOC}
              />
            </div>
            <div className={styles.chartSide}>
              <GraficoTipoEvento
                resumen={resumenEnVivo}
                filtros={filtrosSOC}
                setFiltros={setFiltrosSOC}
                setPage={setPageSOC}
              />
            </div>
          </div>

          <div className={styles.chartsGridFull}>
            <GraficoEstadoGestion
              resumen={resumenEnVivo}
              filtros={filtrosSOC}
              setFiltros={setFiltrosSOC}
              setPage={setPageSOC}
            />
          </div>

          <DashboardSOCAnalytics
            resumen={resumenEnVivo}
            filtros={filtrosSOC}
            setFiltros={setFiltrosSOC}
            setPage={setPageSOC}
            incidentesList={listaIncidentesEnVivo}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN STREAMING: CONTROLES, RADAR Y TABLA EN VIVO           */}
      {/* ============================================================== */}
      {(viewMode === "streaming" || viewMode === "integral") && (
        <>
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

          {/* RADAR: BANNER ÚLTIMO EVENTO INGESTADO CON BOTÓN DE NEUTRALIZACIÓN */}
          <BannerUltimoEvento
            evento={ultimoEvento}
            onNeutralizarUsuario={handleNeutralizarUsuario}
            isNeutralizado={
              ultimoEvento &&
              neutralizadosIds.includes(
                String(ultimoEvento.id_user || ultimoEvento.name_user)
              )
            }
          />

          {/* QUICK FILTER PILLS */}
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

          {/* TABLA DE EVENTOS EN VIVO CON ACCIÓN DE NEUTRALIZACIÓN */}
          <TablaEventosEnVivo
            eventos={eventos}
            filtros={filtros}
            setFiltros={setFiltros}
            onSeleccionarEvento={(ev) => setEventoSeleccionado(ev)}
            onNeutralizarUsuario={handleNeutralizarUsuario}
            neutralizadosIds={neutralizadosIds}
            autoScroll={autoScroll}
            setAutoScroll={setAutoScroll}
          />
        </>
      )}

      {/* MODAL DE INSPECCIÓN DETALLADA */}
      {eventoSeleccionado && (
        <ModalInspeccionEvento
          evento={eventoSeleccionado}
          onClose={() => setEventoSeleccionado(null)}
          onNeutralizarUsuario={handleNeutralizarUsuario}
          isNeutralizado={neutralizadosIds.includes(
            String(eventoSeleccionado.id_user || eventoSeleccionado.name_user)
          )}
        />
      )}
    </div>
  );
}
