import { useState } from "react";
import { useLocation } from "react-router";
import styles from "./EntrenamientoPage.module.css";
import KPICardsSOC from "../componentes/kpi_cards_soc/KPICardsSOC";
import DashboardSOCAnalytics from "../componentes/dashboard_soc_analytics/DashboardSOCAnalytics";
import TablaIncidentes from "../componentes/tabla_incidentes/TablaIncidentes";
import EvaluacionModelo from "../componentes/evaluacion_modelo/EvaluacionModelo";
import {
  useIncidentes,
  useResumenSOC,
  useEjecutarCorrelacion,
  useAlertasBloqueados,
} from "../../../api/apiCorrelacion";
import { toast } from "sonner";
import { FaShieldHalved, FaBrain, FaArrowsRotate, FaGear } from "react-icons/fa6";

export default function EntrenamientoPage() {
  const location = useLocation();
  const [vista, setVista] = useState(() => location.pathname.startsWith("/incidentes") ? "incidentes" : "evaluacion");
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
        `Correlación completada: ${res.total_incidentes_generados} incidentes analizados y sincronizados.`,
      );
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Error al ejecutar correlación.");
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
            Modelos híbridos de Isolation Forest: evaluación independiente, metas de desempeño y análisis de incidentes.
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
              title="Actualizar incidentes con el motor de correlación"
            >
              <FaArrowsRotate className={ejecutarMutation.isPending ? "fa-spin" : ""} />
              {ejecutarMutation.isPending ? "Correlacionando..." : "Actualizar correlación"}
            </button>
          </div>
          <div className={styles.modelBadgeActive}>
            <span className={styles.activeDot} />
            Isolation Forest + reglas de riesgo
          </div>
        </div>
      </div>

      <div className={styles.filterPills} role="tablist" aria-label="Vistas del módulo de entrenamiento">
        <button type="button" role="tab" id="tab-evaluacion" aria-selected={vista === "evaluacion"} aria-controls="panel-evaluacion"
          className={`${styles.pill} ${vista === "evaluacion" ? styles.pillActive : ""}`} onClick={() => setVista("evaluacion")}>
          Evaluación del modelo
        </button>
        <button type="button" role="tab" id="tab-incidentes" aria-selected={vista === "incidentes"} aria-controls="panel-incidentes"
          className={`${styles.pill} ${vista === "incidentes" ? styles.pillActive : ""}`} onClick={() => setVista("incidentes")}>
          Incidentes y correlación
        </button>
      </div>
      {vista === "evaluacion" && <div role="tabpanel" id="panel-evaluacion" aria-labelledby="tab-evaluacion"><EvaluacionModelo /></div>}
      {vista === "incidentes" && <div role="tabpanel" id="panel-incidentes" aria-labelledby="tab-incidentes">

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
      </div>}
    </div>
  );
}
