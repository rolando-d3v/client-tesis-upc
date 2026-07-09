import { Link } from "react-router";
import styles from "../eventosPage.module.css";
import ClasificacionDocumental from "../../componentes/ClasificacionDocumental/ClasificacionDocumental";
import VolumenMB from "../../componentes/VolumenMB/VolumenMB";
import { useD4Clasificacion } from "../../../../api/apiEventos";

export default function Dashboard4Clasificacion() {
  const d4Q = useD4Clasificacion();
  const loading = d4Q.isLoading;
  const data = d4Q.data;
  const hasData = data && data.por_clasificacion?.length > 0;

  return (
    <div className={styles.page}>
      <h1>📄 Dashboard 4 — Clasificación Documental y Volumen</h1>
      <p className={styles.subtitle}>Análisis de qué se accede y cuánto pesa — verificar volumen/tipo inusual</p>

      {loading && (<div className={styles.overlay}><div className={styles.spinner} /><p>Cargando...</p></div>)}

      {!hasData && !loading && (
        <div className={styles.emptyState}><div className={styles.emptyIcon}>📄</div>
          <p>No hay datos. Ve a <Link to="/carga_eventos" style={{ color: "#c084fc", textDecoration: "underline", fontWeight: "bold" }}>Cargar CSV</Link> primero.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className={styles.animateIn}>
            <ClasificacionDocumental
              porClasificacion={data.por_clasificacion}
              cruce={data.cruce_clasificacion_horario}
              porTipoDocumento={data.por_tipo_documento}
            />
          </div>
          <div className={styles.animateIn} style={{ marginTop: "1.5rem" }}>
            <VolumenMB mbPorDia={data.mb_por_dia} mbPorOficina={data.mb_por_oficina} />
          </div>
        </>
      )}
    </div>
  );
}
