import { useMemo } from "react";
import { Link } from "react-router";
import {
  FaBuilding,
  FaChartLine,
  FaFileLines,
  FaLock,
  FaMoon,
  FaUsers,
} from "react-icons/fa6";
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

function SectionHeader({ id, icon: Icon, title, description, tag, tagTone = "default" }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionHeading}>
        <span className={styles.sectionIcon} aria-hidden="true">
          <Icon />
        </span>
        <div>
          <h2 id={id} className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
      </div>
      {tag && (
        <span className={`${styles.sectionTag} ${tagTone !== "default" ? styles[`tag_${tagTone}`] : ""}`}>
          {tag}
        </span>
      )}
    </div>
  );
}

function ChartCard({ icon: Icon, title, description, children }) {
  return (
    <section className={styles.chartCard} aria-label={title}>
      <div className={styles.chartHeading}>
        <span className={styles.chartIcon} aria-hidden="true">
          <Icon />
        </span>
        <h3>{title}</h3>
      </div>
      <p className={styles.chartHelper}>{description}</p>
      <div className={styles.chartContent}>{children}</div>
    </section>
  );
}

export default function Dashboard4Clasificacion() {
  const d4Q = useD4Clasificacion();
  const d5Q = useD5Deteccion();
  const data = d4Q.data;
  const scatterData = data?.scatter_data || d5Q.data?.scatter_data || [];
  const loading = d4Q.isLoading;
  const hasData = Boolean(
    data &&
      [
        data.por_clasificacion,
        data.cruce_clasificacion_horario,
        data.mb_por_dia,
        data.mb_por_oficina,
        data.por_tipo_documento,
        scatterData,
      ].some((list) => Array.isArray(list) && list.length > 0),
  );

  const kpis = useMemo(() => {
    if (!data?.por_clasificacion) return null;

    const totalMb = data.por_clasificacion.reduce((acc, row) => acc + (Number(row.total_mb) || 0), 0);
    const secreto = data.por_clasificacion.find(
      (row) => row.clasificacion?.toLowerCase() === "secreto",
    );
    const mbSecreto = Number(secreto?.total_mb) || 0;
    const descargasFueraHr = data.por_clasificacion.reduce(
      (acc, row) => acc + (Number(row.n_fuera_horario) || 0),
      0,
    );
    const usuariosCriticos = scatterData.filter(
      (row) => row.nivel_riesgo === "critico" || row.nivel_riesgo === "alto",
    ).length;

    return { totalMb, mbSecreto, descargasFueraHr, usuariosCriticos };
  }, [data, scatterData]);

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Seguridad de la información</p>
        <h1>Clasificación documental y volumen</h1>
        <p className={styles.subtitle}>
          Revisa la sensibilidad de los documentos, los patrones de transferencia y las señales de riesgo por usuario.
        </p>
      </header>

      {loading && !data && (
        <div className={styles.loadingState} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <strong>Cargando analítica</strong>
            <span>Estamos preparando los indicadores y gráficos del módulo.</span>
          </div>
        </div>
      )}

      {!loading && d4Q.isError && !hasData && (
        <div className={styles.emptyState} role="alert">
          <span className={styles.emptyIcon} aria-hidden="true">
            !
          </span>
          <h2>No se pudo cargar el análisis</h2>
          <p>Revisa la conexión y vuelve a intentarlo.</p>
          <button type="button" className={styles.retryButton} onClick={() => d4Q.refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !d4Q.isError && !hasData && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true">
            <FaFileLines />
          </span>
          <h2>Aún no hay datos para mostrar</h2>
          <p>Cuando cargues un archivo de eventos, aquí aparecerán los indicadores y el análisis documental.</p>
          <Link to="/carga_eventos" className={styles.emptyLink}>
            Ir a cargar eventos
          </Link>
        </div>
      )}

      {hasData && (
        <>
          {kpis && (
            <section className={styles.summarySection} aria-labelledby="resumen-title">
              <div className={styles.summaryHeader}>
                <div>
                  <h2 id="resumen-title">Resumen ejecutivo</h2>
                  <p>Indicadores clave del conjunto de eventos analizado</p>
                </div>
              </div>
              <div className={styles.kpiGrid}>
                <CardResumenEventos
                  icon="secreto"
                  label="Volumen clasificado secreto"
                  value={`${kpis.mbSecreto.toLocaleString("es-PE", { maximumFractionDigits: 1 })} MB`}
                  sub="Transferencias de máxima sensibilidad"
                />
                <CardResumenEventos
                  icon="fuera_horario"
                  label="Eventos fuera de horario"
                  value={kpis.descargasFueraHr.toLocaleString("es-PE")}
                  sub="Actividad registrada fuera de jornada"
                />
                <CardResumenEventos
                  icon="anomalos"
                  label="Usuarios de riesgo alto o crítico"
                  value={kpis.usuariosCriticos.toLocaleString("es-PE")}
                  sub="Identificados por el análisis de anomalías"
                />
                <CardResumenEventos
                  icon="total"
                  label="Volumen total transferido"
                  value={`${kpis.totalMb.toLocaleString("es-PE", { maximumFractionDigits: 1 })} MB`}
                  sub="Volumen acumulado en el conjunto analizado"
                />
              </div>
            </section>
          )}

          <section className={styles.dashboardSection} aria-labelledby="riesgo-title">
            <SectionHeader
              id="riesgo-title"
              icon={FaUsers}
              title="Riesgo por usuario y horario"
              description="Identifica usuarios atípicos y compara transferencias dentro y fuera de la jornada."
              tag="Atención prioritaria"
              tagTone="critical"
            />
            <div className={styles.chartsGrid}>
              <ChartCard
                icon={FaChartLine}
                title="Anomalía y volumen por usuario"
                description="Cada punto representa un usuario. La posición compara su score y volumen; el tamaño refleja sus eventos."
              >
                <ScatterDeteccion data={scatterData} />
              </ChartCard>
              <ChartCard
                icon={FaMoon}
                title="Transferencias por horario y clasificación"
                description="Compara el volumen transferido dentro y fuera de horario para cada nivel documental."
              >
                <CruceClasificacionHorario cruce={data?.cruce_clasificacion_horario} />
              </ChartCard>
            </div>
          </section>

          <section className={styles.dashboardSection} aria-labelledby="volumen-title">
            <SectionHeader
              id="volumen-title"
              icon={FaChartLine}
              title="Evolución y distribución del volumen"
              description="Explora cuándo se concentra el tráfico y qué dependencias registran mayor volumen."
              tag="Contexto operativo"
              tagTone="info"
            />
            <div className={styles.chartsGrid}>
              <ChartCard
                icon={FaChartLine}
                title="Volumen transferido por día"
                description="Consulta la tendencia diaria y filtra por mes para localizar picos de actividad."
              >
                <MbPorDia mbPorDia={data?.mb_por_dia} />
              </ChartCard>
              <ChartCard
                icon={FaBuilding}
                title="Volumen por oficina"
                description="Dependencias con mayor volumen transferido; desplázate para revisar el listado completo."
              >
                <MbPorOficina mbPorOficina={data?.mb_por_oficina} />
              </ChartCard>
            </div>
          </section>

          <section className={styles.dashboardSection} aria-labelledby="auditoria-title">
            <SectionHeader
              id="auditoria-title"
              icon={FaFileLines}
              title="Clasificación y actividad documental"
              description="Consulta el detalle de eventos y los tipos de documento con mayor frecuencia de acceso."
              tag="Auditoría"
            />
            <div className={styles.chartsGrid}>
              <ChartCard
                icon={FaLock}
                title="Actividad por nivel de clasificación"
                description="Eventos, descargas, volumen y actividad registrada fuera de horario."
              >
                <TablaClasificacion porClasificacion={data?.por_clasificacion} />
              </ChartCard>
              <ChartCard
                icon={FaFileLines}
                title="Tipos de documento más consultados"
                description="Frecuencia de acceso por tipo de documento o extensión."
              >
                <TopTiposDocumento porTipoDocumento={data?.por_tipo_documento} />
              </ChartCard>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
