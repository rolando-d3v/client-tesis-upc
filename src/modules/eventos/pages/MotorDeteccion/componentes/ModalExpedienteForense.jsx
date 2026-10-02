import React, { useEffect, useMemo } from "react";
import { Link } from "react-router";
import styles from "./ModalExpedienteForense.module.css";
import dayjs from "dayjs";
import {
  FaXmark,
  FaFolderOpen,
  FaFileLines,
  FaUserSecret,
  FaArrowUpRightFromSquare,
  FaShieldHalved,
  FaClock,
  FaBan,
} from "react-icons/fa6";
import RoleBadge from "../../../../../components/RoleBadge";
import ScoreGauge from "../../../../entrenamiento/componentes/ScoreGauge";
import MotivosDesglose from "../../../../entrenamiento/componentes/MotivosDesglose";
import StorylineTimeline from "../../../../entrenamiento/componentes/StorylineTimeline";
import AccionesContencion from "../../../../entrenamiento/componentes/AccionesContencion";
import { useIncidenteDetalle } from "../../../../../api/apiCorrelacion";
import { evaluarEstadoForense } from "../telemetria";

export default function ModalExpedienteForense({
  incidente,
  neutralizadosIds = [],
  onClose,
  detalleBasePath = "/eventos/motor-deteccion/incidente",
}) {
  // Manejo de tecla ESC para cerrar modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Si el incidente tiene ID numérico (en base de datos), consultar detalle enriquecido
  const isPersisted = typeof incidente?.id === "number" || /^\d+$/.test(String(incidente?.id || ""));
  const { data: detalleDB } = useIncidenteDetalle(isPersisted ? incidente?.id : null);

  // Fusionar datos disponibles en tiempo real con datos de base de datos
  const dataActiva = useMemo(() => {
    if (!incidente) return null;
    const base = {
      ...incidente,
      ...(detalleDB || {}),
      storyline: detalleDB?.storyline?.length ? detalleDB.storyline : incidente.storyline || [],
      motivos_trazabilidad:
        detalleDB?.motivos_trazabilidad?.length ? detalleDB.motivos_trazabilidad : incidente.motivos_trazabilidad || [],
      motivos_eventos:
        detalleDB?.motivos_eventos?.length ? detalleDB.motivos_eventos : incidente.motivos_eventos || [],
    };

    const evalForense = evaluarEstadoForense(base, neutralizadosIds);

    // Garantizar que si es crítico, el storyline incluya el paso de Contención Inmediata SOC
    let storylineFinal = [...base.storyline];
    const tienePasoContencion = storylineFinal.some(
      (s) => String(s.fase || "").toLowerCase().includes("contención") || String(s.fase || "").toLowerCase().includes("contencion")
    );
    if (evalForense.esCritico && !tienePasoContencion) {
      storylineFinal.push({
        paso: storylineFinal.length + 1,
        fase: "Contención Inmediata SOC",
        descripcion: `Neutralización automática ejecutada según constantes.py (Score ${(Number(base.score_correlacion || 0.85) * 100).toFixed(0)}% >= 75%). Cuenta del usuario bloqueada y accesos revocados preventivamente.`,
        timestamp: base.fecha_deteccion || new Date().toISOString(),
        icono: "shield",
        nivel_riesgo: "critico",
      });
    }

    return {
      ...base,
      estado: evalForense.estadoEfectivo,
      cuenta_bloqueada: evalForense.esBloqueado,
      es_critico_auto: evalForense.esCritico,
      storyline: storylineFinal,
    };
  }, [incidente, detalleDB, neutralizadosIds]);

  if (!dataActiva) return null;

  const dtFormatted = dataActiva.fecha_deteccion
    ? dayjs(dataActiva.fecha_deteccion).format("DD/MM/YYYY HH:mm:ss")
    : "Fecha no registrada";

  const nivel = (dataActiva.nivel_riesgo || "bajo").toLowerCase();
  const riesgoClass =
    nivel === "critico"
      ? styles.riesgoCritico
      : nivel === "alto"
      ? styles.riesgoAlto
      : nivel === "medio"
      ? styles.riesgoMedio
      : styles.riesgoBajo;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FaFolderOpen />
            </div>
            <div className={styles.titleArea}>
              <h2 className={styles.title}>
                Expediente Forense Completo — #{dataActiva.id}
                {dataActiva.es_en_vivo && (
                  <span className={styles.badgeLive}>
                    <span className={styles.pulseDot} /> En Vivo (Streaming)
                  </span>
                )}
                <span className={`${styles.badgeRiesgo} ${riesgoClass}`}>
                  {dataActiva.nivel_riesgo || "Bajo"}
                </span>
                {dataActiva.estado === "contenido" && (
                  <span className={styles.badgeContenido} title="Contenido en tiempo real según constantes.py">
                    <FaShieldHalved /> Auto-Contenido
                  </span>
                )}
              </h2>
              <p className={styles.subtitle}>
                <FaClock style={{ marginRight: 4 }} />
                Detectado: {dtFormatted} · Score de Correlación:{" "}
                <strong>{Math.round(Number(dataActiva.score_correlacion || 0) * 100)}%</strong>
              </p>
            </div>
          </div>

          <div className={styles.headerRight}>
            <Link
              to={`${detalleBasePath}/${dataActiva.id}`}
              className={styles.btnDedicada}
              title="Abrir expediente en página completa"
            >
              <FaArrowUpRightFromSquare /> Vista Dedicada
            </Link>
            <button type="button" className={styles.closeBtn} onClick={onClose} title="Cerrar expediente">
              <FaXmark />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className={styles.body}>
          {/* Tarjetas de Entidades Involucradas */}
          <div className={styles.entitiesGrid}>
            {/* Documento Involucrado */}
            <div className={styles.entityCard}>
              <div className={styles.entityHeader}>
                <FaFileLines style={{ color: "#3b82f6" }} />
                <span>Documento Comprometido / Auditado</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>ID Documento:</span>
                <span className={styles.entityVal}>#{dataActiva.id_documento || "N/A"}</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Número / Código:</span>
                <span className={styles.entityVal}>{dataActiva.numero_documento || "S/N"}</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Clasificación de Seguridad:</span>
                <span
                  className={styles.entityVal}
                  style={{
                    fontWeight: 700,
                    color:
                      dataActiva.clasificacion_doc === "SECRETO"
                        ? "#dc2626"
                        : dataActiva.clasificacion_doc === "RESERVADO"
                        ? "#ea580c"
                        : "#2563eb",
                  }}
                >
                  {dataActiva.clasificacion_doc || "COMUN"}
                </span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Tipo de Trámite:</span>
                <span className={styles.entityVal}>{dataActiva.tipo_documento || "OFICIO"}</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Destino Registrado:</span>
                <span className={styles.entityVal}>
                  {dataActiva.destino_doc === "exterior" ? "🌐 Exterior (Alto Riesgo)" : "🏢 Interior"}
                </span>
              </div>
            </div>

            {/* Usuario Sospechoso */}
            <div className={styles.entityCard}>
              <div className={styles.entityHeader}>
                <FaUserSecret style={{ color: "#8b5cf6" }} />
                <span>Perfil del Usuario Investigado</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Nombre del Usuario:</span>
                <span className={styles.entityVal}>{dataActiva.nombre_usuario || "Desconocido"}</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Rol Institucional:</span>
                <span className={styles.entityVal}>
                  <RoleBadge role={dataActiva.name_role || dataActiva.rol || dataActiva.role} size="small" />
                </span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>ID / DNI Usuario:</span>
                <span className={styles.entityVal}>#{dataActiva.id_user}</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Oficina / Dependencia:</span>
                <span className={styles.entityVal}>{dataActiva.name_oficina || "División SOC / Operaciones"}</span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Sesión de Auditoría:</span>
                <span className={styles.entityVal}>
                  Doc: #{dataActiva.sesion_traza_id || "N/A"} · Ev: #{dataActiva.sesion_eventos_id || "N/A"}
                </span>
              </div>
              <div className={styles.entityRow}>
                <span className={styles.entityLabel}>Estado de Cuenta:</span>
                <span className={styles.entityVal}>
                  {dataActiva.cuenta_bloqueada ? (
                    <span className={styles.badgeCuentaBloqueada} title="Cuenta bloqueada y neutralizada en tiempo real según constantes.py (Score >= 0.75 / UMBRAL_CRITICO)">
                      <FaBan /> Cuenta Bloqueada / Neutralizada
                    </span>
                  ) : (
                    <span className={styles.badgeCuentaActiva}>
                      ● Activa
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Gauge de Riesgo Multi-Dominio */}
          <ScoreGauge incidente={dataActiva} />

          {/* Explicabilidad XAI: Desglose de Motivos */}
          <MotivosDesglose
            motivosTraza={dataActiva.motivos_trazabilidad}
            motivosEventos={dataActiva.motivos_eventos}
          />

          {/* Storyline Timeline: Reconstrucción Cronológica */}
          <StorylineTimeline storyline={dataActiva.storyline} />

          {/* Acciones de Contención SOC e Informe Pericial */}
          <AccionesContencion incidente={dataActiva} />
        </div>
      </div>
    </div>
  );
}
