import { Link } from "react-router";
import styles from "../eventosPage.module.css";
import TablaUsuarios from "../../componentes/TablaUsuarios/TablaUsuarios";
import { useD2Usuarios } from "../../../../api/apiEventos";

export default function Dashboard2Usuarios() {
  const d2Q = useD2Usuarios();
  const loading = d2Q.isLoading;
  const data = d2Q.data;
  const hasData = data && data.usuarios?.length > 0;

  return (
    <div className={styles.page}>
      <h1>👤 Dashboard 2 — Comportamiento por Usuario</h1>
      <p className={styles.subtitle}>Perfil de comportamiento por usuario — panel principal de la tesis</p>

      {loading && (
        <div className={styles.overlay}><div className={styles.spinner} /><p>Cargando...</p></div>
      )}

      {!hasData && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👤</div>
          <p>No hay datos. Ve a <Link to="/carga_eventos" style={{ color: "#c084fc", textDecoration: "underline", fontWeight: "bold" }}>Cargar CSV</Link> primero.</p>
        </div>
      )}

      {hasData && (
        <>
          <div className={styles.chartCard}>
            <h3><span>📋</span> Tabla de Usuarios (clic en "Ver" para drill-down cronológico)</h3>
            <TablaUsuarios usuarios={data.usuarios} />
          </div>

          {data.rankings && (
            <div className={styles.chartsGrid} style={{ marginTop: "1.5rem" }}>
              {[
                { key: "mas_eventos", title: "📊 Más Eventos", field: "valor" },
                { key: "mas_mb", title: "💾 Más MB", field: "valor" },
                { key: "mas_secreto", title: "🔒 Más Docs Secreto", field: "valor" },
                { key: "mas_fuera_horario", title: "🌙 Más Fuera Horario", field: "valor" },
              ].map(({ key, title }) => (
                <div key={key} className={styles.chartCard}>
                  <h3>{title}</h3>
                  <div style={{ fontSize: "0.78rem" }}>
                    {data.rankings[key]?.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <span style={{ color: "#e2e8f0" }}>{i + 1}. {item.nombre}</span>
                        <span style={{ color: "#c084fc", fontWeight: 700 }}>{typeof item.valor === "number" ? item.valor.toLocaleString() : item.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
