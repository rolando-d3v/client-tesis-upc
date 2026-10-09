import styles from "./ModalReportePericial.module.css";
import dayjs from "dayjs";
import {
  FaXmark,
  FaPrint,
  FaFileContract,
  FaShieldHalved,
  FaClock,
  FaEye,
  FaTriangleExclamation,
  FaBan,
  FaCircleCheck,
} from "react-icons/fa6";
import RoleBadge from "../../../../components/RoleBadge";

export default function ModalReportePericial({ reporte, onClose }) {
  if (!reporte) return null;

  const {
    metadata_reporte = {},
    resumen_ejecutivo = {},
    entidades_involucradas = {},
    auditoria_acceso_documental = {},
    registro_neutralizacion = {},
    recomendaciones_operativas = [],
  } = reporte;

  const doc = entidades_involucradas.documento || {};
  const usr = entidades_involucradas.usuario || {};

  const lecturasVista =
    auditoria_acceso_documental.auditoria_lecturas_vista?.usuarios_que_vieron || [];
  const accionesRiesgo = auditoria_acceso_documental.acciones_de_riesgo || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <FaFileContract className={styles.titleIcon} />
            <div>
              <h2 className={styles.title}>Dictamen Pericial Forense Oficial</h2>
            </div>
            <span className={styles.codeBadge}>
              {metadata_reporte.codigo_incidente || "INC-DICTAMEN"}
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            title="Cerrar dictamen"
          >
            <FaXmark />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Banner Institucional */}
          <div className={styles.institutionalBanner}>
            <div>
              <p className={styles.instTitle}>
                {metadata_reporte.entidad ||
                  "Sistema Predictivo de Neutralización de Fuga de Información"}
              </p>
              <p className={styles.instSubtitle}>
                Centro de Operaciones de Seguridad (SOC) · Expediente Técnico de Auditoría Forense
              </p>
            </div>
            <div className={styles.instMeta}>
              <span>
                <strong>Emisión:</strong>{" "}
                {metadata_reporte.fecha_emision
                  ? dayjs(metadata_reporte.fecha_emision).format("DD/MM/YYYY HH:mm:ss")
                  : "N/A"}
              </span>
              <span>
                <strong>Clasificación:</strong>{" "}
                {metadata_reporte.clasificacion_informe || "CONFIDENCIAL"}
              </span>
              <span>
                <strong>Versión:</strong> {metadata_reporte.version_documento || "1.0-FORENSE"}
              </span>
            </div>
          </div>

          {/* Estado de Neutralización Preventiva */}
          {registro_neutralizacion.cuenta_neutralizada ? (
            <div className={styles.neutralizacionBox}>
              <FaBan className={styles.neutralizacionIcon} />
              <div className={styles.neutralizacionText}>
                <span className={styles.neutralizacionTitle}>
                  🚨 CUENTA NEUTRALIZADA PREVENTIVAMENTE (BLOQUEO ACTIVO)
                </span>
                <span className={styles.neutralizacionDesc}>
                  El usuario <strong>{usr.nombre} (DNI: {usr.id_user})</strong> fue bloqueado el{" "}
                  {registro_neutralizacion.fecha_bloqueo
                    ? dayjs(registro_neutralizacion.fecha_bloqueo).format("DD/MM/YYYY HH:mm:ss")
                    : "Fecha no especificada"}{" "}
                  por {registro_neutralizacion.responsable || "ANALISTA_SOC"}. Motivo:{" "}
                  <em>{registro_neutralizacion.motivo}</em>
                </span>
              </div>
            </div>
          ) : (
            <div
              className={styles.neutralizacionBox}
              style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
            >
              <FaCircleCheck
                className={styles.neutralizacionIcon}
                style={{ color: "#16a34a" }}
              />
              <div className={styles.neutralizacionText}>
                <span className={styles.neutralizacionTitle} style={{ color: "#15803d" }}>
                  ESTADO DE GESTIÓN: {resumen_ejecutivo.estado_gestion?.toUpperCase() || "ABIERTO"}
                </span>
                <span className={styles.neutralizacionDesc} style={{ color: "#166534" }}>
                  Nivel de Amenaza: <strong>{resumen_ejecutivo.nivel_riesgo?.toUpperCase()}</strong> ·
                  Score de Correlación:{" "}
                  <strong>{Math.round((resumen_ejecutivo.score_correlacion || 0) * 100)}%</strong>
                </span>
              </div>
            </div>
          )}

          {/* Entidades Involucradas */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <FaShieldHalved style={{ color: "#3b82f6" }} /> Entidades Correlacionadas
            </div>
            <div className={styles.grid2}>
              {/* Documento */}
              <div className={styles.infoCard}>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>
                  📄 Documento Clasificado Afectado
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID / Código:</span>
                  <span className={styles.infoVal}>
                    #{doc.id_documento} ({doc.numero || "S/N"})
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Clasificación:</span>
                  <span className={styles.infoVal} style={{ color: "#dc2626", fontWeight: 700 }}>
                    {doc.clasificacion || "COMUN"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Tipo de Trámite:</span>
                  <span className={styles.infoVal}>{doc.tipo || "OFICIO"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Destino:</span>
                  <span className={styles.infoVal}>
                    {doc.destino === "exterior" ? "🌐 Exterior" : "🏢 Interior"}
                  </span>
                </div>
              </div>

              {/* Usuario */}
              <div className={styles.infoCard}>
                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>
                  👤 Usuario Implicado en la Amenaza
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Nombre Completo:</span>
                  <span className={styles.infoVal}>{usr.nombre || "Desconocido"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID / DNI:</span>
                  <span className={styles.infoVal}>{usr.id_user}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Rol Institucional:</span>
                  <span className={styles.infoVal}>
                    <RoleBadge role={usr.rol || usr.name_role || "USER"} size="medium" />
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Oficina / Unidad:</span>
                  <span className={styles.infoVal}>{usr.oficina || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AUDITORÍA FORENSE DE ACCESOS (VISTA - USUARIOS Y HORA EXACTA) */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <FaEye style={{ color: "#7c3aed" }} /> Auditoría Forense de Visualizaciones (VISTA)
            </div>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
              Registro cronológico inmutable de todos los usuarios que consultaron o vieron este
              documento clasificado con indicación exacta de hora, rol y oficina.
            </p>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha y Hora Exacta</th>
                    <th>Usuario</th>
                    <th>DNI / ID</th>
                    <th>Rol Institucional</th>
                    <th>Oficina</th>
                    <th>Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturasVista.length > 0 ? (
                    lecturasVista.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <FaClock style={{ marginRight: "0.4rem", color: "#64748b" }} />
                          {item.fecha_hora
                            ? dayjs(item.fecha_hora).format("DD/MM/YYYY HH:mm:ss")
                            : "N/A"}
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.usuario}</td>
                        <td>{item.id_user}</td>
                        <td>
                          <RoleBadge role={item.rol || item.name_role || "USER"} size="small" />
                        </td>
                        <td>{item.oficina}</td>
                        <td>
                          {item.fuera_horario ? (
                            <span className={styles.badgeAlert}>⚠️ Fuera de Horario</span>
                          ) : (
                            <span className={styles.badgeSuccess}>Horario Laboral</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>
                        No se registraron accesos adicionales de tipo VISTA para este documento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* OTRAS ACCIONES DE RIESGO AUDITADAS (DESCARGAR, EDITAR, ELIMINAR, GUARDAR_COPIA) */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>
              <FaTriangleExclamation style={{ color: "#ea580c" }} /> Acciones de Alto Riesgo
              Registradas
            </div>
            <div className={styles.grid2}>
              {/* Descargas */}
              <div className={styles.infoCard}>
                <div style={{ fontWeight: 700, color: "#9a3412" }}>
                  📥 Descargas / Extracción Local: {accionesRiesgo.descargas?.total || 0}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {accionesRiesgo.descargas?.descripcion}
                </div>
              </div>

              {/* Ediciones */}
              <div className={styles.infoCard}>
                <div style={{ fontWeight: 700, color: "#9a3412" }}>
                  ✏️ Ediciones / Alteraciones: {accionesRiesgo.ediciones?.total || 0}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {accionesRiesgo.ediciones?.descripcion}
                </div>
              </div>

              {/* Eliminaciones */}
              <div className={styles.infoCard}>
                <div style={{ fontWeight: 700, color: "#dc2626" }}>
                  🗑️ Eliminaciones (Riesgo Máximo): {accionesRiesgo.eliminaciones?.total || 0}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {accionesRiesgo.eliminaciones?.descripcion}
                </div>
              </div>

              {/* Guardado Copia */}
              <div className={styles.infoCard}>
                <div style={{ fontWeight: 700, color: "#9a3412" }}>
                  📋 Guardado de Copia Duplicada: {accionesRiesgo.guardado_de_copia?.total || 0}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {accionesRiesgo.guardado_de_copia?.descripcion}
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones Operativas */}
          {recomendaciones_operativas.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <FaShieldHalved style={{ color: "#16a34a" }} /> Recomendaciones de Seguridad SOC
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "#334155" }}>
                {recomendaciones_operativas.map((rec, i) => (
                  <li key={i} style={{ marginBottom: "0.35rem" }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.btnCloseModal} onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className={styles.btnPrint} onClick={handlePrint}>
            <FaPrint /> Imprimir Dictamen / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
