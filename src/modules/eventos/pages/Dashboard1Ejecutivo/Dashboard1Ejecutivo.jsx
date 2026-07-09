import { Link } from "react-router";
import styles from "../eventosPage.module.css";
import CardResumenEventos from "../../componentes/CardResumenEventos/CardResumenEventos";
import SemaforoRiesgo from "../../componentes/SemaforoRiesgo/SemaforoRiesgo";
import TopRiesgo from "../../componentes/TopRiesgo/TopRiesgo";
import TablaAlertas from "../../componentes/TablaAlertas/TablaAlertas";
import { useD1Resumen, useD1Semaforo, useD1TopRiesgo, useD1Alertas, useD1Timeline } from "../../../../api/apiEventos";

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
      <h1>🔍 Dashboard 1 — Resumen Ejecutivo</h1>
      <p className={styles.subtitle}>Estado general del sistema de detección de riesgo</p>

      {loading && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p>Cargando Dashboard...</p>
        </div>
      )}

      {!hasData && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤖</div>
          <p>No hay datos cargados. Ve a{" "}
            <Link to="/carga_eventos" style={{ color: "#c084fc", textDecoration: "underline", fontWeight: "bold" }}>
              Cargar CSV Eventos
            </Link>{" "}para comenzar el análisis.
          </p>
        </div>
      )}

      {hasData && (
        <>
          <div className={styles.cardsGrid}>
            <CardResumenEventos icon="total" label="Total Eventos" value={resumen.total_eventos?.toLocaleString()} sub="Registros analizados" />
            <CardResumenEventos icon="usuarios" label="Usuarios Activos" value={resumen.usuarios_activos} sub={`${resumen.usuarios_anomalos} de riesgo`} />
            <CardResumenEventos icon="secreto" label="Docs SECRETO" value={resumen.docs_secreto?.toLocaleString()} sub="Accesos clasificados" />
            <CardResumenEventos icon="fuera_horario" label="Fuera de Horario" value={`${resumen.eventos_fuera_horario?.toLocaleString()}`} sub={`${resumen.pct_fuera_horario}% del total`} />
            <CardResumenEventos icon="anomalos" label="Eventos Anómalos (IF)" value={resumen.total_anomalias_if?.toLocaleString()} sub={`${resumen.pct_anomalias}% detectados`} />
            <CardResumenEventos icon="riesgo" label="Score Riesgo Promedio" value={resumen.score_riesgo_promedio?.toFixed(1)} sub="Score global" />
            <CardResumenEventos icon="vista" label="Vistas" value={resumen.n_vistas?.toLocaleString()} />
            <CardResumenEventos icon="descarga" label="Descargas" value={resumen.n_descargas?.toLocaleString()} />
            <CardResumenEventos icon="editar" label="Editados" value={resumen.n_editados?.toLocaleString()} />
            <CardResumenEventos icon="eliminar" label="Eliminados" value={resumen.n_eliminados?.toLocaleString()} />
            <CardResumenEventos icon="copia" label="Guardar Copia" value={resumen.n_guardar_copia?.toLocaleString()} />
          </div>

          <div className={styles.chartCard} style={{ marginBottom: "1.5rem" }}>
            <h3><span>🚦</span> Semáforo de Riesgo por Usuario</h3>
            <SemaforoRiesgo data={semaforoQ.data} />
          </div>

          <div className={styles.animateIn}>
            <TopRiesgo topUsuarios={topQ.data?.top_usuarios} topDocumentos={topQ.data?.top_documentos} />
          </div>

          {alertasQ.data?.length > 0 && (
            <div className={styles.chartCard} style={{ marginTop: "1.5rem" }}>
              <h3><span>⚠️</span> Alertas Activas</h3>
              <TablaAlertas data={alertasQ.data} />
            </div>
          )}

          {timelineQ.data?.length > 0 && (
            <div className={styles.chartCard} style={{ marginTop: "1.5rem" }}>
              <h3><span>⏱️</span> Timeline de Eventos Críticos</h3>
              <div style={{ overflowX: "auto", maxHeight: 300, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8" }}>Fecha</th>
                      <th style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8" }}>Hora</th>
                      <th style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8" }}>Usuario</th>
                      <th style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8" }}>Evento</th>
                      <th style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8" }}>Clasificación</th>
                      <th style={{ padding: "0.5rem", textAlign: "left", color: "#94a3b8" }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineQ.data.map((ev, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "0.45rem 0.5rem", color: "#e2e8f0" }}>{ev.fecha}</td>
                        <td style={{ padding: "0.45rem 0.5rem", color: "#e2e8f0", fontFamily: "monospace" }}>{ev.hora}</td>
                        <td style={{ padding: "0.45rem 0.5rem", color: "#e2e8f0", fontWeight: 600 }}>{ev.usuario}</td>
                        <td style={{ padding: "0.45rem 0.5rem", color: "#e2e8f0" }}>{ev.evento}</td>
                        <td style={{ padding: "0.45rem 0.5rem", color: "#e2e8f0" }}>{ev.clasificacion}</td>
                        <td style={{ padding: "0.45rem 0.5rem", color: "#f97316", fontWeight: 700 }}>{ev.score?.toFixed(1)}</td>
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
