import { useState } from "react";
import styles from "./AccionesContencion.module.css";
import {
  useActualizarEstadoIncidente,
  useNeutralizarUsuario,
  useReporteIncidente,
} from "../../../api/apiCorrelacion";
import ModalReportePericial from "./ModalReportePericial";
import { toast } from "sonner";
import {
  FaShieldHalved,
  FaMagnifyingGlass,
  FaHandcuffs,
  FaCheckDouble,
  FaBan,
  FaFileContract,
} from "react-icons/fa6";

const getStatusBadge = (estado) => {
  switch (estado?.toLowerCase()) {
    case "abierto":
      return <span className={`${styles.statusBadge} ${styles.statusAbierto}`}>Abierto</span>;
    case "en_investigacion":
      return <span className={`${styles.statusBadge} ${styles.statusInvestigacion}`}>En Investigación</span>;
    case "contenido":
      return <span className={`${styles.statusBadge} ${styles.statusContenido}`}>Contenido</span>;
    case "mitigado":
      return <span className={`${styles.statusBadge} ${styles.statusMitigado}`}>Mitigado</span>;
    case "falso_positivo":
      return <span className={`${styles.statusBadge} ${styles.statusFalso}`}>Falso Positivo</span>;
    default:
      return <span className={styles.statusBadge}>{estado}</span>;
  }
};

export default function AccionesContencion({ incidente }) {
  const [nota, setNota] = useState("");
  const [showModalReporte, setShowModalReporte] = useState(false);
  const updateMutation = useActualizarEstadoIncidente();
  const neutralizarMutation = useNeutralizarUsuario();
  const { data: reporteData } = useReporteIncidente(incidente?.id);

  if (!incidente) return null;

  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      await updateMutation.mutateAsync({
        id: incidente.id,
        estado: nuevoEstado,
        accion_tomada: nota.trim() || undefined,
      });
      toast.success(`Incidente actualizado a '${nuevoEstado}'.`);
      setNota("");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Error actualizando incidente.");
    }
  };

  const handleNeutralizar = async () => {
    const confirmacion = window.confirm(
      `¿Confirmar NEUTRALIZACIÓN INMEDIATA (bloqueo preventivo de credenciales) para el usuario ${incidente.nombre_usuario || "ID " + incidente.id_user}?`
    );
    if (!confirmacion) return;

    try {
      const motivoDefecto =
        nota.trim() ||
        `Neutralización preventiva inmediata por detección de amenaza de fuga en Incidente #${incidente.id} (Score: ${Math.round(
          (incidente.score_correlacion || 0) * 100
        )}%)`;

      const res = await neutralizarMutation.mutateAsync({
        incidente_id: incidente.id,
        id_user: incidente.id_user,
        nombre_usuario: incidente.nombre_usuario || "Usuario",
        motivo: motivoDefecto,
        responsable: "ANALISTA_SOC",
      });

      toast.success(
        res?.mensaje || "Cuenta de usuario neutralizada preventivamente con éxito."
      );
      setNota("");
    } catch (error) {
      toast.error(
        error?.response?.data?.detail || "Error al ejecutar neutralización de cuenta."
      );
    }
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.title}>
            <FaShieldHalved style={{ color: "#2563eb" }} />
            Acciones del analista
          </div>
          <div className={styles.statusWrapper}>
            <span>Estado actual:</span>
            {getStatusBadge(incidente.estado)}
          </div>
        </div>

        <div className={styles.form} data-pdf-ignore="true">
          <label className={styles.label} htmlFor="nota-analista">
            Nota de intervención <span>(opcional)</span>
          </label>
          <textarea
            id="nota-analista"
            className={styles.textarea}
            placeholder="Registra el motivo o los pasos acordados antes de actualizar el estado."
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />

          <div className={styles.btnGroup}>
            <button
              className={`${styles.btn} ${styles.btnInvestigar}`}
              disabled={updateMutation.isPending || incidente.estado === "en_investigacion"}
              onClick={() => handleCambiarEstado("en_investigacion")}
            >
              <FaMagnifyingGlass /> Iniciar investigación
            </button>

            <button
              className={`${styles.btn} ${styles.btnContener}`}
              disabled={updateMutation.isPending || incidente.estado === "contenido"}
              onClick={() => handleCambiarEstado("contenido")}
            >
              <FaHandcuffs /> Contener amenaza
            </button>

            <button
              className={`${styles.btn} ${styles.btnMitigar}`}
              disabled={updateMutation.isPending || incidente.estado === "mitigado"}
              onClick={() => handleCambiarEstado("mitigado")}
            >
              <FaCheckDouble /> Marcar mitigado
            </button>

            <button
              className={`${styles.btn} ${styles.btnDescartar}`}
              disabled={updateMutation.isPending || incidente.estado === "falso_positivo"}
              onClick={() => handleCambiarEstado("falso_positivo")}
            >
              <FaBan /> Marcar falso positivo
            </button>

            {/* Acción Crítica: Neutralización / Bloqueo Inmediato */}
            <button
              className={`${styles.btn} ${styles.btnNeutralizar}`}
              disabled={neutralizarMutation.isPending}
              onClick={handleNeutralizar}
              title="Ejecuta la neutralización preventiva de la cuenta del usuario en el sistema"
            >
              <FaBan /> Bloquear cuenta
            </button>

            {/* Acción Forense: Dictamen Pericial */}
            <button
              className={`${styles.btn} ${styles.btnReporte}`}
              onClick={() => setShowModalReporte(true)}
              title="Ver el informe pericial forense completo del incidente"
            >
              <FaFileContract /> Abrir informe pericial
            </button>
          </div>
        </div>

        {incidente.accion_tomada && (
          <div className={styles.accionAnterior}>
            <strong>Última acción registrada:</strong> {incidente.accion_tomada}
          </div>
        )}
      </div>

      {/* Modal Dictamen Pericial Forense */}
      {showModalReporte && (
        <ModalReportePericial
          reporte={reporteData}
          onClose={() => setShowModalReporte(false)}
        />
      )}
    </>
  );
}
