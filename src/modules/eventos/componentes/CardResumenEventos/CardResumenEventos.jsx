import styles from "./CardResumenEventos.module.css";
import { 
  FaChartBar, FaUsers, FaFileAlt, FaLock, 
  FaMoon, FaExclamationTriangle, FaBullseye, 
  FaEye, FaDownload, FaEdit, FaTrashAlt, FaCopy 
} from "react-icons/fa";

const ICON_MAP = {
  total: <FaChartBar />,
  usuarios: <FaUsers />,
  documentos: <FaFileAlt />,
  secreto: <FaLock />,
  fuera_horario: <FaMoon />,
  anomalos: <FaExclamationTriangle />,
  riesgo: <FaBullseye />,
  vista: <FaEye />,
  descarga: <FaDownload />,
  editar: <FaEdit />,
  eliminar: <FaTrashAlt />,
  copia: <FaCopy />,
};

export default function CardResumenEventos({ icon, label, value, sub }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardIcon}>{ICON_MAP[icon] || <FaChartBar style={{ fontSize: "2rem" }} />}</div>
      <div className={styles.cardInfo}>
        <span className={styles.cardLabel}>{label}</span>
        <span className={styles.cardValue}>{value}</span>
        {sub && <span className={styles.cardSub}>{sub}</span>}
      </div>
    </div>
  );
}
