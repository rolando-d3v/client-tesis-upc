import { useMemo } from "react";
import { Link } from "react-router";
import styles from "./clasifi.module.css";
import {
  TablaClasificacion,
  CruceClasificacionHorario,
  TopTiposDocumento,
} from "../../componentes/ClasificacionDocumental/ClasificacionDocumental";
import { MbPorDia, MbPorOficina } from "../../componentes/VolumenMB/VolumenMB";
import ScatterDeteccion from "../../componentes/ScatterDeteccion/ScatterDeteccion";
import CardResumenEventos from "../../componentes/CardResumenEventos/CardResumenEventos";
import { useD4Clasificacion, useD5Deteccion } from "../../../../api/apiEventos";

export default function Dashboard4Clasificacion() {
  const d4Q = useD4Clasificacion();
  const d5Q = useD5Deteccion();
  const loading = d4Q.isLoading;
  const data = d4Q.data;
  const hasData = data && data.por_clasificacion?.length > 0;
  const scatterData = data?.scatter_data || d5Q.data?.scatter_data || [];

  // KPIs calculados para respuesta rápida del Jefe de Seguridad
  const kpis = useMemo(() => {
    if (!data?.por_clasificacion) return null;

    const totalMb = data.por_clasificacion.reduce((acc, c) => acc + (c.total_mb || 0), 0);
    const itemSecreto = data.por_clasificacion.find(
      (c) => c.clasificacion?.toLowerCase() === "secreto"
    );
    const mbSecreto = itemSecreto ? itemSecreto.total_mb || 0 : 0;
    const descargasFueraHr = data.por_clasificacion.reduce(
      (acc, c) => acc + (c.n_fuera_horario || 0),
      0
    );
    const usuariosCriticos = scatterData.filter(
      (d) => d.nivel_riesgo === "critico" || d.nivel_riesgo === "alto"
    ).length;

    return { totalMb, mbSecreto, descargasFueraHr, usuariosCriticos };
  }, [data, scatterData]);

  return (
    <div className={styles.page}>
      <header>
        <h1>Clasificación Documental y Volumen</h1>
        <p className={styles.subtitle}>
          Monitoreo de sensibilidad de información, correlación con horarios y detección de anomalías por volumen
        </p>
      </header>

      {loading && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p>Cargando información de seguridad...</p>
        </div>
      )}

      {!hasData && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <p>
            No hay datos. Ve a{" "}
            <Link to="/carga_eventos" className={styles.emptyLink}>
              Cargar CSV
            </Link>{" "}
            primero.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* ============================================================ */}
          {/* NIVEL 1: KPIs Ejecutivos de Resumen Rápido (Triage en 3s)     */}
          {/* ============================================================ */}
          {kpis && (
            <div className={`${styles.kpiGrid} ${styles.animateIn}`}>
              <CardResumenEventos
                icon="secreto"
                label="Volumen Secreto"
                value={`${kpis.mbSecreto.toFixed(1)} MB`}
                sub="Información de máxima confidencialidad"
              />
              <CardResumenEventos
                icon="fuera_horario"
                label="Fuera de Horario"
                value={kpis.descargasFueraHr.toLocaleString()}
                sub="Eventos en horarios no laborales"
              />
              <CardResumenEventos
                icon="anomalos"
                label="Usuarios Riesgo Alto/Crítico"
                value={kpis.usuariosCriticos}
                sub="Detectados por Isolation Forest"
              />
              <CardResumenEventos
                icon="total"
                label="Volumen Total"
                value={`${kpis.totalMb.toFixed(1)} MB`}
                sub="Tráfico acumulado analizado"
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* NIVEL 2: Detección Inmediata y Vectores de Exfiltración       */}
          {/* ============================================================ */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>🚨</span> Nivel 1: Detección Inmediata y Vectores de Exfiltración
            </h2>
            <span className={`${styles.sectionTag} ${styles.sectionTagCritical}`}>
              Prioridad Crítica
            </span>
          </div>

          <div className={`${styles.chartsGrid} ${styles.animateIn}`}>
            <div className={styles.chartCard}>
              <h3>
                <span>🎯</span> Score IF vs Volumen (MB) por Usuario
              </h3>
              <p className={styles.chartHelper}>
                🟢 Bajo | 🟡 Medio | 🟠 Alto | 🔴 Crítico — tamaño = cantidad de eventos
              </p>
              <ScatterDeteccion data={scatterData} />
            </div>

            <div className={styles.chartCard}>
              <h3>
                <span>🌙</span> Cruce: Clasificación Documental × Horario
              </h3>
              <p className={styles.chartHelper}>
                Transferencia de datos fuera de horario vs en horario por nivel de sensibilidad
              </p>
              <CruceClasificacionHorario cruce={data.cruce_clasificacion_horario} />
            </div>
          </div>

          {/* ============================================================ */}
          {/* NIVEL 3: Dinámica Temporal y Distribución por Oficina         */}
          {/* ============================================================ */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>📊</span> Nivel 2: Comportamiento Temporal y Distribución por Oficina
            </h2>
            <span className={`${styles.sectionTag} ${styles.sectionTagInfo}`}>
              Contexto Operativo
            </span>
          </div>

          <div className={`${styles.chartsGrid} ${styles.animateIn}`}>
            <div className={styles.chartCard}>
              <h3>
                <span>📈</span> MB Transferidos por Día
              </h3>
              <p className={styles.chartHelper}>
                Evolución temporal del tráfico para identificación de picos inusuales
              </p>
              <MbPorDia mbPorDia={data.mb_por_dia} />
            </div>

            <div className={styles.chartCard}>
              <h3>
                <span>🏢</span> MB por Oficina (Top 15)
              </h3>
              <p className={styles.chartHelper}>
                Concentración de volumen transferido según dependencia u oficina
              </p>
              <MbPorOficina mbPorOficina={data.mb_por_oficina} />
            </div>
          </div>

          {/* ============================================================ */}
          {/* NIVEL 4: Auditoría Forense y Detalle Documental              */}
          {/* ============================================================ */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>🔍</span> Nivel 3: Detalle Forense e Inventario Documental
            </h2>
            <span className={styles.sectionTag}>Auditoría y Evidencia</span>
          </div>

          <div className={`${styles.chartsGrid} ${styles.animateIn}`}>
            <div className={styles.chartCard}>
              <h3>
                <span>📋</span> Detalle por Nivel de Clasificación
              </h3>
              <p className={styles.chartHelper}>
                Desglose forense de eventos, descargas, volumen y accesos fuera de horario
              </p>
              <TablaClasificacion porClasificacion={data.por_clasificacion} />
            </div>

            <div className={styles.chartCard}>
              <h3>
                <span>📄</span> Top Tipos de Documento
              </h3>
              <p className={styles.chartHelper}>
                Frecuencia de acceso clasificada por tipo de documento o extensión
              </p>
              <TopTiposDocumento porTipoDocumento={data.por_tipo_documento} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
