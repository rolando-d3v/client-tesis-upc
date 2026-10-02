import { useParams, Link, useLocation } from "react-router";
import styles from "./IncidenteDetallePage.module.css";
import dayjs from "dayjs";
import { useIncidenteDetalle } from "../../../api/apiCorrelacion";
import ScoreGauge from "../componentes/ScoreGauge";
import MotivosDesglose from "../componentes/MotivosDesglose";
import StorylineTimeline from "../componentes/StorylineTimeline";
import AccionesContencion from "../componentes/AccionesContencion";
import RoleBadge from "../../../components/RoleBadge";
import {
  FaArrowLeft,
  FaFileLines,
  FaUserSecret,
  FaTriangleExclamation,
  FaClock,
} from "react-icons/fa6";

export default function IncidenteDetallePage() {
  const { id } = useParams();
  const location = useLocation();
  const { data: incidente, isLoading, error } = useIncidenteDetalle(id);

  // Detectar el contexto de navegacion para el breadcrumb dinamico
  const esDesdeMotor = location.pathname.includes("/eventos/motor-deteccion") ||
    location.pathname.includes("/eventos/monitoreo-vivo");
  const backPath = esDesdeMotor
    ? (location.pathname.includes("/monitoreo-vivo") ? "/eventos/monitoreo-vivo" : "/eventos/motor-deteccion")
    : "/incidentes";
  const backLabel = esDesdeMotor ? "Motor de Deteccion — Expediente Forense" : "Centro de Incidentes";
  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrapper}>
          <FaClock style={{ fontSize: "2rem", marginBottom: "0.5rem" }} />
          <p>Cargando expediente de incidente #{id}...</p>
        </div>
      </div>
    );
  }

  if (error || !incidente) {
    return (
      <div className={styles.page}>
        <div className={styles.breadcrumb}>
          <Link to={backPath} className={styles.backLink}>
            <FaArrowLeft /> Volver a {backLabel}
          </Link>
        </div>
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#dc2626" }}>
          <FaTriangleExclamation style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }} />
          <h2>Incidente #{id} no encontrado</h2>
          <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>
            El registro solicitado no existe o no pudo ser recuperado de la base de datos.
          </p>
        </div>
      </div>
    );
  }

  const dtFormatted = incidente.fecha_deteccion
    ? dayjs(incidente.fecha_deteccion).format("DD/MM/YYYY HH:mm:ss")
    : "Fecha no registrada";

  return (
    <div className={styles.page}>
      {/* Navegacion y Breadcrumbs */}
      <div className={styles.breadcrumb}>
        <Link to={backPath} className={styles.backLink}>
          <FaArrowLeft /> {backLabel}
        </Link>
        <span>/</span>
        <span>Expediente de Amenaza #{incidente.id}</span>
      </div>
      {/* Cabecera del expediente */}
      <div className={styles.headerCard}>
        <div className={styles.titleArea}>
          <h1 className={styles.incTitle}>
            Incidente #{incidente.id}: Fuga Potencial de Información
          </h1>
          <span className={styles.incDate}>
            Detectado por el motor de correlación: {dtFormatted}
          </span>
        </div>
      </div>

      {/* Tarjetas de entidades correlacionadas */}
      <div className={styles.entitiesGrid}>
        {/* Entidad Documento */}
        <div className={styles.entityCard}>
          <div className={styles.entityHeader}>
            <FaFileLines style={{ color: "#3b82f6" }} />
            <span>Documento Involucrado</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>ID Documento:</span>
            <span className={styles.entityVal}>#{incidente.id_documento}</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Número / Código:</span>
            <span className={styles.entityVal}>{incidente.numero_documento || "S/N"}</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Clasificación:</span>
            <span className={styles.entityVal} style={{ fontWeight: 700, color: "#b91c1c" }}>
              {incidente.clasificacion_doc || "COMUN"}
            </span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Tipo de Trámite:</span>
            <span className={styles.entityVal}>{incidente.tipo_documento || "OFICIO"}</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Destino Registrado:</span>
            <span className={styles.entityVal}>
              {incidente.destino_doc === "exterior" ? "ðŸŒ Exterior" : "ðŸ¢ Interior"}
            </span>
          </div>
        </div>

        {/* Entidad Usuario */}
        <div className={styles.entityCard}>
          <div className={styles.entityHeader}>
            <FaUserSecret style={{ color: "#8b5cf6" }} />
            <span>Usuario Sospechoso</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Nombre Completo:</span>
            <span className={styles.entityVal}>{incidente.nombre_usuario || "Desconocido"}</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Rol Institucional:</span>
            <span className={styles.entityVal}>
              <RoleBadge role={incidente.name_role || incidente.rol || incidente.role} size="medium" />
            </span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>ID / DNI Usuario:</span>
            <span className={styles.entityVal}>{incidente.id_user}</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Sesión Trazabilidad:</span>
            <span className={styles.entityVal}>#{incidente.sesion_traza_id || "N/A"}</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Sesión Eventos:</span>
            <span className={styles.entityVal}>#{incidente.sesion_eventos_id || "N/A"}</span>
          </div>
          <div className={styles.entityRow}>
            <span className={styles.entityLabel}>Nivel de Riesgo Global:</span>
            <span className={styles.entityVal} style={{ textTransform: "uppercase", color: "#dc2626" }}>
              {incidente.nivel_riesgo}
            </span>
          </div>
        </div>
      </div>

      {/* Gauge de Riesgo Multi-Dominio */}
      <ScoreGauge incidente={incidente} />

      {/* Explicabilidad XAI */}
      <MotivosDesglose
        motivosTraza={incidente.motivos_trazabilidad}
        motivosEventos={incidente.motivos_eventos}
      />

      {/* Línea de Tiempo / Storyline Auditado */}
      <StorylineTimeline storyline={incidente.storyline} />

      {/* Panel de Contención SOC */}
      <AccionesContencion incidente={incidente} />
    </div>
  );
}
