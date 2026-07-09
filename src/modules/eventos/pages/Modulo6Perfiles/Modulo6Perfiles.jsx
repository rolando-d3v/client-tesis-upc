import { Link } from "react-router";
import styles from "../eventosPage.module.css";
import PerfilUsuarioEWMA from "../../componentes/PerfilUsuarioEWMA/PerfilUsuarioEWMA";
import { useM6Perfiles } from "../../../../api/apiEventos";

export default function Modulo6Perfiles() {
  const m6Q = useM6Perfiles();
  const loading = m6Q.isLoading;
  const data = m6Q.data;
  const hasData = data && data.perfiles?.length > 0;

  return (
    <div className={styles.page}>
      <h1>⭐ Módulo 6 — Evaluación Incremental</h1>
      <p className={styles.subtitle}>
        Perfiles de usuario con EWMA — el sistema detecta el momento exacto en que alguien se desvía de su comportamiento habitual
      </p>

      {loading && (<div className={styles.overlay}><div className={styles.spinner} /><p>Cargando...</p></div>)}

      {!hasData && !loading && (
        <div className={styles.emptyState}><div className={styles.emptyIcon}>⭐</div>
          <p>No hay datos. Ve a <Link to="/carga_eventos" style={{ color: "#c084fc", textDecoration: "underline", fontWeight: "bold" }}>Cargar CSV</Link> primero.</p>
        </div>
      )}

      {hasData && (
        <div className={styles.animateIn}>
          <PerfilUsuarioEWMA perfiles={data.perfiles} ewmaTemporal={data.ewma_temporal} />
        </div>
      )}
    </div>
  );
}
