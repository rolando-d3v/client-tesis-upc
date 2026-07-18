import { Link } from "react-router";
import styles from "./dash.module.css";
import CardResumenEventos from "../../componentes/CardResumenEventos/CardResumenEventos";
import SemaforoRiesgo from "../../componentes/SemaforoRiesgo/SemaforoRiesgo";
import TopRiesgo from "../../componentes/TopRiesgo/TopRiesgo";
import TablaAlertas from "../../componentes/TablaAlertas/TablaAlertas";
import { useD1Resumen, useD1Semaforo, useD1TopRiesgo, useD1Alertas, useD1Timeline } from "../../../../api/apiEventos";

const getScoreClass = (score) => {
  if (score >= 8) return styles.scoreCritico;
  if (score >= 6) return styles.scoreAlto;
  if (score >= 4) return styles.scoreMedio;
  return styles.scoreBajo;
};

const getClasificacionClass = (clasif) => {
  const map = {
    SECRETO: styles.clasificacionSecreto,
    RESERVADO: styles.clasificacionReservado,
    CONFIDENCIAL: styles.clasificacionConfidencial,
    COMUN: styles.clasificacionComun,
  };
  return map[clasif?.toUpperCase()] || "";
};

export default function Dashboard1Ejecutivo() {
  const resumenQ = useD1Resumen();
  const semaforoQ = useD1Semaforo();
  const topQ = useD1TopRiesgo();
  const alertasQ = useD1Alertas();
  const timelineQ = useD1Timeline();

  const loading = resumenQ.isLoading || semaforoQ.isLoading;
  const resumen = resumenQ.data;
  const hasData = resumen && resumen.total_eventos > 0;

  return (
    <div className={styles.page}>
      <h1>🔍 Dashboard de evento de usuarios</h1>
      <p className={styles.subtitle}>Estado general del sistema predictivo de eventos y comportamiento del usuario</p>

      {loading && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p>Cargando Dashboard...</p>
        </div>
      )}

      {!hasData && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤖</div>
          <p>
            No hay datos cargados. Ve a{" "}
            <Link to="/carga_eventos" className={styles.emptyStateLink}>
              Cargar CSV Eventos
            </Link>{" "}
            para comenzar el análisis.
          </p>
        </div>
      )}

      {hasData && (
        <>
          <div className={styles.cardsGrid}>
            <CardResumenEventos
              icon="total"
              label="Total Eventos"
              value={resumen.total_eventos?.toLocaleString()}
              sub="Registros analizados"
            />
            <CardResumenEventos
              icon="usuarios"
              label="Usuarios Activos"
              value={resumen.usuarios_activos}
              sub={`${resumen.usuarios_anomalos} de riesgo`}
            />
            <CardResumenEventos
              icon="secreto"
              label="Docs SECRETO"
              value={resumen.docs_secreto?.toLocaleString()}
              sub="Accesos clasificados"
            />
            <CardResumenEventos
              icon="fuera_horario"
              label="Fuera de Horario"
              value={`${resumen.eventos_fuera_horario?.toLocaleString()}`}
              sub={`${resumen.pct_fuera_horario}% del total`}
            />
            <CardResumenEventos
              icon="anomalos"
              label="Eventos Anómalos (IF)"
              value={resumen.total_anomalias_if?.toLocaleString()}
              sub={`${resumen.pct_anomalias}% detectados`}
            />
            <CardResumenEventos
              icon="riesgo"
              label="Score Riesgo Promedio"
              value={resumen.score_riesgo_promedio?.toFixed(1)}
              sub="Score global"
            />
            <CardResumenEventos icon="vista" label="Vistas" value={resumen.n_vistas?.toLocaleString()} />
            <CardResumenEventos icon="descarga" label="Descargas" value={resumen.n_descargas?.toLocaleString()} />
            <CardResumenEventos icon="editar" label="Editados" value={resumen.n_editados?.toLocaleString()} />
            <CardResumenEventos icon="eliminar" label="Eliminados" value={resumen.n_eliminados?.toLocaleString()} />
            <CardResumenEventos icon="copia" label="Guardar Copia" value={resumen.n_guardar_copia?.toLocaleString()} />
          </div>

          <div className={styles.chartCard}>
            <h3>
              <span>🚦</span> Semáforo de Riesgo por Usuario
            </h3>
            <SemaforoRiesgo data={semaforoQ.data} />
          </div>

          <br />
          <div className={styles.animateIn}>
            <TopRiesgo topUsuarios={topQ.data?.top_usuarios} topDocumentos={topQ.data?.top_documentos} />
          </div>

          <br />
          {alertasQ.data?.length > 0 && (
            <div className={styles.chartCardAlert}>
              <h3>
                <span>⚠️</span> Alertas Activas
              </h3>
              <TablaAlertas data={alertasQ.data} />
            </div>
          )}
          <br />

          {timelineQ.data?.length > 0 && (
            <div className={styles.chartCardTimeline}>
              <h3>
                <span>⏱️</span> Timeline de Eventos Críticos
              </h3>
              <div className={styles.timelineCounter}>
                <span className={styles.timelineCounterText}>
                  Mostrando eventos críticos ordenados por fecha
                </span>
                <span className={styles.timelineCounterBadge}>
                  {timelineQ.data.length} eventos
                </span>
              </div>
              <div className={styles.timelineTableContainer}>
                <table className={styles.timelineTable}>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Usuario</th>
                      <th>Evento</th>
                      <th>Clasificación</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineQ.data.map((ev, i) => (
                      <tr key={i} className={styles.timelineRow}>
                        <td className={styles.timelineTdDate}>{i + 1}</td>
                        <td className={styles.timelineTdDate}>{ev.fecha}</td>
                        <td className={styles.timelineTdTime}>{ev.hora}</td>
                        <td className={styles.timelineTdUser}>{ev.usuario}</td>
                        <td className={styles.timelineTdEvent}>{ev.evento}</td>
                        <td className={styles.timelineTdClasificacion}>
                          <span className={`${styles.clasificacionBadge} ${getClasificacionClass(ev.clasificacion)}`}>
                            {ev.clasificacion}
                          </span>
                        </td>
                        <td className={styles.timelineTdScore}>
                          <span className={`${styles.scoreBadge} ${getScoreClass(ev.score)}`}>
                            {ev.score?.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
