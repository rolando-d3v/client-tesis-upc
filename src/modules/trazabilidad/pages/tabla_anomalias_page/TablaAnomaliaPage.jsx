import { Link } from "react-router";
import TableAnomalias from "../../components/tabla_anomalias/TableAnomalias";
import styles from "./TablaAnomaliaPage.module.css";
import {
  FaShieldHalved,
  FaChartPie,
  FaTable,
  FaTimeline,
  FaCloudArrowUp,
  FaChevronRight,
} from "react-icons/fa6";

export default function TablaAnomaliaPage() {
  return (
    <div className={styles.pageContainer}>
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link to="/anomalias" className={styles.breadcrumbLink}>
          Módulo de Anomalías
        </Link>
        <FaChevronRight aria-hidden="true" />
        <span className={styles.breadcrumbCurrent} aria-current="page">Auditoría</span>
      </nav>

      <header className={styles.headerArea}>
        <div className={styles.titleIconWrapper} aria-hidden="true">
          <FaShieldHalved className={styles.titleIcon} />
        </div>
        <div className={styles.headerTitleWrapper}>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>
              Auditoría de anomalías
            </h1>
            <span className={styles.badgePill}>Modelo Híbrido IA + DLP</span>
          </div>
          <p className={styles.pageSubtitle}>
            Prioriza los riesgos, revisa los registros y explora la trazabilidad de cada documento.
          </p>
        </div>
      </header>

      <div className={styles.navigationBar}>
        <nav className={styles.navTabs} aria-label="Vistas de anomalías">
          <Link to="/anomalias" className={styles.navTab}>
            <FaChartPie aria-hidden="true" />
            Dashboard
          </Link>
          <Link
            to="/anomalias/tabla"
            className={`${styles.navTab} ${styles.navTabActive}`}
            aria-current="page"
          >
            <FaTable aria-hidden="true" />
            Auditoría
          </Link>
          <Link to="/anomalias/timeline" className={styles.navTab}>
            <FaTimeline aria-hidden="true" />
            Línea de tiempo
          </Link>
        </nav>
        <Link to="/carga_anomalias" className={styles.uploadAction}>
          <FaCloudArrowUp aria-hidden="true" />
          Cargar CSV
        </Link>
      </div>

      {/* Contenido: Tabla Interactiva con KPIs, Filtros y Ficha Forense */}
      <div className={styles.contentArea}>
        <TableAnomalias />
      </div>
    </div>
  );
}
