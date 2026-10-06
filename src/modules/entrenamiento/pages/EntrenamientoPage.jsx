import { useState } from "react";
import styles from "./EntrenamientoPage.module.css";
import KPICardsSOC from "../componentes/KPICardsSOC";
import DashboardSOCAnalytics from "../componentes/DashboardSOCAnalytics";
import TablaIncidentes from "../componentes/TablaIncidentes";
import {
  useIncidentes,
  useResumenSOC,
  useEjecutarCorrelacion,
  useAlertasBloqueados,
} from "../../../api/apiCorrelacion";
import { toast } from "sonner";
import { FaShieldHalved, FaBrain, FaArrowsRotate, FaGear } from "react-icons/fa6";

export default function EntrenamientoPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtros, setFiltros] = useState({
    nivel_riesgo: "",
    estado: "",
    clasificacion: "",
    busqueda: "",
    mes: "",
    tipo_evento: "",
  });

  const { data: resumen } = useResumenSOC();
  const { data: alertasBloqueo } = useAlertasBloqueados();
  const {
    data: incidentesData,
    isLoading: loadingIncidentes,
    refetch,
  } = useIncidentes({
    page,
    page_size: pageSize,
    ...filtros,
  });

  const ejecutarMutation = useEjecutarCorrelacion();

  const handleEjecutar = async () => {
    try {
      const res = await ejecutarMutation.mutateAsync({});
      toast.success(
        `Entrenamiento y correlación completada: ${res.total_incidentes_generados} incidentes analizados y sincronizados.`,
      );
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Error al ejecutar entrenamiento.");
    }
  };

  const handleQuickFilter = (tipo) => {
    if (tipo === "critico") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "critico" ? "" : "critico",
        estado: "",
      }));
    } else if (tipo === "alto") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: prev.nivel_riesgo === "alto" ? "" : "alto",
        estado: "",
      }));
    } else if (tipo === "abierto") {
      setFiltros((prev) => ({
        ...prev,
        nivel_riesgo: "",
        estado: prev.estado === "abierto" ? "" : "abierto",
      }));
    } else {
      setFiltros({ nivel_riesgo: "", estado: "", clasificacion: "", busqueda: "", mes: "", tipo_evento: "" });
    }
    setPage(1);
  };

  const totalBloqueados = Array.isArray(alertasBloqueo)
    ? alertasBloqueo.length
    : alertasBloqueo?.total_cuentas_bloqueadas || 0;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            <FaBrain style={{ color: "#7c3aed" }} /> Módulo de Entrenamiento y Calibración
          </h1>
          <p className={styles.subtitle}>
            Fase de Aprendizaje MLOps: Calibración de Isolation Forest Dual, Ponderación de Riesgo y Serialización
            (.joblib)
          </p>
        </div>
      </div>

      {/* Panel MLOps de Entrenamiento y Calibración */}
      <div className={styles.trainingPanel}>
        <div className={styles.trainingTop}>
          <div className={styles.trainingHeaderLeft}>
            <h3>
              <FaGear style={{ color: "#7c3aed" }} /> Ejecución del Motor de Correlación
            </h3>
            <p>Ejecuta la correlación para actualizar los incidentes analizados</p>
          </div>

          <div className={styles.trainingGrid}>
            <button
              type="button"
              className={styles.btnTrainExecute}
              onClick={handleEjecutar}
              disabled={ejecutarMutation.isPending}
              title="Ejecutar reentrenamiento y correlación"
            >
              <FaArrowsRotate className={ejecutarMutation.isPending ? "fa-spin" : ""} />
              {ejecutarMutation.isPending ? "Entrenando Modelo..." : "Reentrenar y Correlacionar"}
            </button>
          </div>
          <div className={styles.modelBadgeActive}>
            <span className={styles.activeDot} />
            Modelo Activo: Isolation Forest v2.1 (.joblib)
          </div>
        </div>
      </div>

      {/* Banner de Contención Activa / Cuentas Neutralizadas */}
      {totalBloqueados > 0 && (
        <div className={styles.alertBanner}>
          <FaShieldHalved className={styles.alertIcon} />
          <div>
            <strong>Centro de Contención SOC Activo:</strong> Se registran{" "}
            <span className={styles.alertCount}>{totalBloqueados}</span> cuentas neutralizadas preventivamente ante
            intentos críticos de fuga de información.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <KPICardsSOC resumen={resumen} filtros={filtros} onFilterClick={handleQuickFilter} />

      {/* Visual Analytics & Cross-Domain Intelligence */}
      <DashboardSOCAnalytics
        resumen={resumen}
        filtros={filtros}
        setFiltros={setFiltros}
        setPage={setPage}
        incidentesList={incidentesData?.incidentes || []}
      />

      {/* Quick Filter Pills */}
      <div className={styles.filterPills}>
        <button
          className={`${styles.pill} ${!filtros.nivel_riesgo && !filtros.estado ? styles.pillActive : ""}`}
          onClick={() => handleQuickFilter("todos")}
        >
          Todos los Incidentes
        </button>
        <button
          className={`${styles.pill} ${styles.pillCritico} ${
            filtros.nivel_riesgo === "critico" ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("critico")}
        >
          🚨 Solo Críticos
        </button>
        <button
          className={`${styles.pill} ${styles.pillAlto} ${filtros.nivel_riesgo === "alto" ? styles.pillActive : ""}`}
          onClick={() => handleQuickFilter("alto")}
        >
          ⚠️ Solo Altos
        </button>
        <button
          className={`${styles.pill} ${filtros.estado === "abierto" ? styles.pillActive : ""}`}
          onClick={() => handleQuickFilter("abierto")}
        >
          🔴 Estado Abierto
        </button>
      </div>

      {/* Incident Table */}
      <TablaIncidentes
        data={incidentesData}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        filtros={filtros}
        setFiltros={setFiltros}
        resumen={resumen}
        onEjecutarCorrelacion={handleEjecutar}
        isExecuting={ejecutarMutation.isPending}
        isLoading={loadingIncidentes}
      />
    </div>
  );
}
