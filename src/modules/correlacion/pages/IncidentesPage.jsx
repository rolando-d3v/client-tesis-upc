import { useState } from "react";
import styles from "./IncidentesPage.module.css";
import KPICardsSOC from "../componentes/KPICardsSOC";
import TablaIncidentes from "../componentes/TablaIncidentes";
import {
  useIncidentes,
  useResumenSOC,
  useEjecutarCorrelacion,
} from "../../../api/apiCorrelacion";
import { toast } from "sonner";

export default function IncidentesPage() {
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    nivel_riesgo: "",
    estado: "",
    clasificacion: "",
    busqueda: "",
  });

  const { data: resumen, isLoading: loadingResumen } = useResumenSOC();
  const { data: incidentesData, isLoading: loadingIncidentes, refetch } = useIncidentes({
    page,
    page_size: 15,
    ...filtros,
  });

  const ejecutarMutation = useEjecutarCorrelacion();

  const handleEjecutar = async () => {
    try {
      const res = await ejecutarMutation.mutateAsync();
      toast.success(
        `Correlación finalizada: ${res.total_incidentes_generados} incidentes analizados.`
      );
      refetch();
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Error al ejecutar correlación.");
    }
  };

  const handleQuickFilter = (tipo) => {
    if (tipo === "critico") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "critico", estado: "" }));
    } else if (tipo === "alto") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "alto", estado: "" }));
    } else if (tipo === "abierto") {
      setFiltros((prev) => ({ ...prev, nivel_riesgo: "", estado: "abierto" }));
    } else {
      setFiltros({ nivel_riesgo: "", estado: "", clasificacion: "", busqueda: "" });
    }
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Incidentes Correlacionados de Fuga</h1>
          <p className={styles.subtitle}>
            Centro de Operaciones de Seguridad (SOC): Fusión de Trazabilidad Documental y Comportamiento de Usuarios
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICardsSOC resumen={resumen} onFilterClick={handleQuickFilter} />

      {/* Quick Filter Pills */}
      <div className={styles.filterPills}>
        <button
          className={`${styles.pill} ${
            !filtros.nivel_riesgo && !filtros.estado ? styles.pillActive : ""
          }`}
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
          className={`${styles.pill} ${styles.pillAlto} ${
            filtros.nivel_riesgo === "alto" ? styles.pillActive : ""
          }`}
          onClick={() => handleQuickFilter("alto")}
        >
          ⚠️ Solo Altos
        </button>
        <button
          className={`${styles.pill} ${
            filtros.estado === "abierto" ? styles.pillActive : ""
          }`}
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
        filtros={filtros}
        setFiltros={setFiltros}
        onEjecutarCorrelacion={handleEjecutar}
        isExecuting={ejecutarMutation.isPending}
      />
    </div>
  );
}
