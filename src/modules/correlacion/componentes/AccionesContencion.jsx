import { useState } from "react";
import styles from "./AccionesContencion.module.css";
import { useActualizarEstadoIncidente } from "../../../api/apiCorrelacion";
import { toast } from "sonner";
import {
  FaShieldHalved,
  FaMagnifyingGlass,
  FaHandcuffs,
  FaCheckDouble,
  FaBan,
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
  const updateMutation = useActualizarEstadoIncidente();

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

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>
          <FaShieldHalved style={{ color: "#7c3aed" }} />
          Gestión de Respuesta a Incidentes (SOC / CISO)
        </div>
        <div className={styles.statusWrapper}>
          <span>Estado actual:</span>
          {getStatusBadge(incidente.estado)}
        </div>
      </div>

      <div className={styles.form}>
        <label className={styles.label} htmlFor="nota-analista">
          Nota u orden de acción del analista SOC:
        </label>
        <textarea
          id="nota-analista"
          className={styles.textarea}
          placeholder="Ej: Se coordinó con Mesa de Ayuda el bloqueo preventivo de credenciales del usuario y aislamiento del documento..."
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />

        <div className={styles.btnGroup}>
          <button
            className={`${styles.btn} ${styles.btnInvestigar}`}
            disabled={updateMutation.isPending || incidente.estado === "en_investigacion"}
            onClick={() => handleCambiarEstado("en_investigacion")}
          >
            <FaMagnifyingGlass /> Iniciar Investigación
          </button>

          <button
            className={`${styles.btn} ${styles.btnContener}`}
            disabled={updateMutation.isPending || incidente.estado === "contenido"}
            onClick={() => handleCambiarEstado("contenido")}
          >
            <FaHandcuffs /> Contener Amenaza
          </button>

          <button
            className={`${styles.btn} ${styles.btnMitigar}`}
            disabled={updateMutation.isPending || incidente.estado === "mitigado"}
            onClick={() => handleCambiarEstado("mitigado")}
          >
            <FaCheckDouble /> Marcar Mitigado
          </button>

          <button
            className={`${styles.btn} ${styles.btnDescartar}`}
            disabled={updateMutation.isPending || incidente.estado === "falso_positivo"}
            onClick={() => handleCambiarEstado("falso_positivo")}
          >
            <FaBan /> Descartar (Falso Positivo)
          </button>
        </div>
      </div>

      {incidente.accion_tomada && (
        <div className={styles.accionAnterior}>
          <strong>Última acción registrada:</strong> {incidente.accion_tomada}
        </div>
      )}
    </div>
  );
}
