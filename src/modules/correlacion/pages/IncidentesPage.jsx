import { useState } from "react";
import styles from "./IncidentesPage.module.css";
import KPICardsSOC from "../componentes/KPICardsSOC";
import GraficoEvolucionRiesgos from "../componentes/GraficoEvolucionRiesgos";
import GraficoTipoEvento from "../componentes/GraficoTipoEvento";
import DashboardSOCAnalytics from "../componentes/DashboardSOCAnalytics";
import GraficoEstadoGestion from "../componentes/GraficoEstadoGestion";
import TablaIncidentes from "../componentes/TablaIncidentes";
import {
  useIncidentes,
  useResumenSOC,
  useEjecutarCorrelacion,
  useAlertasBloqueados,
} from "../../../api/apiCorrelacion";
import { toast } from "sonner";
import { FaShieldHalved } from "react-icons/fa6";

export default function IncidentesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
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
      const res = await ejecutarMutation.mutateAsync();
      toast.success(`Correlación finalizada: ${res.total_incidentes_generados} incidentes analizados.`);
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
    : (alertasBloqueo?.total_cuentas_bloqueadas || 0);

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Incidentes Correlacionados de Fuga</h1>
        </div>
        <div>
          <p className={styles.subtitle}>
            Centro de Operaciones de Seguridad (SOC): Fusión de Trazabilidad Documental y Comportamiento de Usuarios
          </p>
        </div>
      </div>

      {/* Banner de Contención Activa / Cuentas Neutralizadas */}
      {totalBloqueados > 0 && (
        <div className={styles.alertBanner}>
          <FaShieldHalved className={styles.alertIcon} />
          <div>
            <strong>Centro de Contención SOC Activo:</strong> Se registran{" "}
            <span className={styles.alertCount}>{totalBloqueados}</span> cuentas neutralizadas
            preventivamente ante intentos críticos de fuga de información.
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <KPICardsSOC
        resumen={resumen}
        filtros={filtros}
        onFilterClick={handleQuickFilter}
      />

      {/* Grid Analítico de Inteligencia SOC: Evolución Temporal y Canales de Fuga */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartMain}>
          <GraficoEvolucionRiesgos
            resumen={resumen}
            filtros={filtros}
            setFiltros={setFiltros}
            setPage={setPage}
          />
        </div>
        <div className={styles.chartSide}>
          <GraficoTipoEvento
            resumen={resumen}
            filtros={filtros}
            setFiltros={setFiltros}
            setPage={setPage}
          />
        </div>
      </div>
      <div className={styles.chartsGridFull}>
        <GraficoEstadoGestion
          resumen={resumen}
          filtros={filtros}
          setFiltros={setFiltros}
          setPage={setPage}
        />
      </div>

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
