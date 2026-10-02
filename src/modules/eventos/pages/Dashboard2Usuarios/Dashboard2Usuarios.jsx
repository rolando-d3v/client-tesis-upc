import { Link } from "react-router";
import { useState, useMemo, useRef } from "react";
import styles from "./dash2.module.css";
import TablaUsuarios from "../../componentes/TablaUsuarios/TablaUsuarios";
import RadarRiesgo from "../../componentes/RadarRiesgo/RadarRiesgo";
import RoleBadge from "../../../../components/RoleBadge";
import { useD2Usuarios, useD5Deteccion } from "../../../../api/apiEventos";

const MESES = [
  { value: "", label: "Todos los meses" },
  { value: "1", label: "Enero" }, { value: "2", label: "Febrero" }, { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" }, { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
  { value: "7", label: "Julio" }, { value: "8", label: "Agosto" }, { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" }, { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
];

const RANKINGS = [
  { key: "mas_mb", title: "💾 Más MB" },
  { key: "mas_secreto", title: "🔒 Más Docs Secreto" },
  { key: "mas_fuera_horario", title: "🌙 Más Fuera Horario" },
];

export default function Dashboard2Usuarios() {
  const [mesesRanking, setMesesRanking] = useState({
    mas_mb: "",
    mas_secreto: "",
    mas_fuera_horario: "",
  });
  const [selectedUserRadar, setSelectedUserRadar] = useState(null);
  const radarRef = useRef(null);

  const d2Q = useD2Usuarios();
  const d5Q = useD5Deteccion();
  const mbQ = useD2Usuarios(mesesRanking.mas_mb);
  const secretoQ = useD2Usuarios(mesesRanking.mas_secreto);
  const fueraHorarioQ = useD2Usuarios(mesesRanking.mas_fuera_horario);
  const loading = d2Q.isLoading;
  const data = d2Q.data;
  const hasData = data && data.usuarios?.length > 0;
  const consultasRanking = {
    mas_mb: mbQ,
    mas_secreto: secretoQ,
    mas_fuera_horario: fueraHorarioQ,
  };

  const cambiarMes = (key, mes) => {
    setMesesRanking((actual) => ({ ...actual, [key]: mes }));
  };

  const handleSelectUser = (item) => {
    if (selectedUserRadar?.user_id === item.user_id && selectedUserRadar?.nombre === item.nombre) {
      setSelectedUserRadar(null);
    } else {
      setSelectedUserRadar(item);
      setTimeout(() => {
        radarRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  // Construir lista dinámica con TODOS los usuarios del sistema (ej. 75 usuarios)
  const radarUsuarios = useMemo(() => {
    const baseRadar = d5Q.data?.radar_usuarios || [];
    const todosUsuariosD2 = data?.usuarios || [];

    if (todosUsuariosD2.length === 0 && baseRadar.length === 0) return [];

    // Mapeo indexado de los usuarios que ya tienen cálculo de radar en backend
    const radarMap = new Map();
    baseRadar.forEach((u) => {
      const key = String(u.user_id ?? u.nombre);
      radarMap.set(key, u);
    });

    // Mapear cada usuario del sistema a sus 6 dimensiones normalizadas
    const listaCompleta = todosUsuariosD2.map((d2User) => {
      const key = String(d2User.user_id ?? d2User.nombre);
      const enRadar = radarMap.get(key);
      if (enRadar) {
        return {
          ...enRadar,
          oficina: enRadar.oficina || d2User.oficina || "",
          user_id: d2User.user_id ?? enRadar.user_id,
          nombre: d2User.nombre ?? enRadar.nombre,
          rol: d2User.rol || d2User.role || enRadar.rol || "USER",
          role: d2User.rol || d2User.role || enRadar.role || "USER",
          score_riesgo: enRadar.score_riesgo ?? d2User.score_riesgo ?? 0,
          nivel_riesgo: enRadar.nivel_riesgo ?? d2User.nivel_riesgo ?? "bajo",
        };
      }

      // Si no estaba en el cálculo inicial, sintetizar sus 6 dimensiones dinámicamente
      const n = d2User.n_eventos || 1;
      return {
        user_id: d2User.user_id,
        nombre: d2User.nombre,
        oficina: d2User.oficina || "",
        rol: d2User.rol || d2User.role || "USER",
        role: d2User.rol || d2User.role || "USER",
        horario: Math.min(Math.round(((d2User.n_fuera_horario || 0) / n) * 100), 100),
        volumen: Math.min(Math.round((d2User.total_mb || 0) / 10), 100),
        clasificacion: Math.min(Math.round(d2User.pct_secreto || 0), 100),
        cambio_comportamiento: Math.min(Math.round((d2User.score_riesgo || 0) * 2), 100),
        acciones_criticas: Math.min(Math.round(((d2User.n_descargas || 0) / n) * 100), 100),
        score_if: Math.min(Math.round((d2User.score_riesgo || 0) * 10), 100),
        score_riesgo: d2User.score_riesgo || 0,
        nivel_riesgo: d2User.nivel_riesgo || "bajo",
      };
    });

    // Agregar cualquier perfil de radar que no estuviera en la tabla de usuarios
    baseRadar.forEach((rUser) => {
      const key = String(rUser.user_id ?? rUser.nombre);
      const existe = listaCompleta.some((u) => String(u.user_id ?? u.nombre) === key);
      if (!existe) {
        listaCompleta.push(rUser);
      }
    });

    // Ordenar de mayor a menor riesgo por defecto para facilitar el análisis
    listaCompleta.sort((a, b) => (b.score_riesgo || 0) - (a.score_riesgo || 0));

    return listaCompleta;
  }, [d5Q.data?.radar_usuarios, data?.usuarios]);

  return (
    <div className={styles.page}>
      <h1 style={{ marginBottom: "25px" }}>Comportamiento por Usuario</h1>
      {loading && (
        <div className={styles.overlay}>
          <div className={styles.spinner} />
          <p>Cargando...</p>
        </div>
      )}

      {!hasData && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👤</div>
          <p>
            No hay datos. Ve a{" "}
            <Link to="/carga_eventos" className={styles.link}>
              Cargar CSV
            </Link>{" "}
            primero.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {data.rankings && (
            <div className={styles.chartsGrid}>
              {RANKINGS.map(({ key, title }) => {
                const consulta = consultasRanking[key];
                const ranking = consulta.data
                  ? (consulta.data.rankings?.[key] ?? [])
                  : (data.rankings[key] ?? []);

                return (
                  <div key={key} className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      <h3>{title}</h3>
                      <label className={styles.monthFilter}>
                        <span className={styles.srOnly}>Filtrar {title} por mes</span>
                        <select value={mesesRanking[key]} onChange={(event) => cambiarMes(key, event.target.value)}>
                          {MESES.map((mes) => <option key={mes.value} value={mes.value}>{mes.label}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className={styles.rankingsList}>
                      {consulta.isFetching && <p className={styles.rankingStatus}>Actualizando ranking…</p>}
                      {!consulta.isFetching && ranking.length === 0 && <p className={styles.rankingStatus}>No hay datos para el mes seleccionado.</p>}
                      {ranking.map((item, i) => {
                        const isSelected =
                          selectedUserRadar &&
                          (selectedUserRadar.user_id === item.user_id ||
                            selectedUserRadar.nombre === item.nombre);
                        return (
                          <div
                            key={i}
                            className={`${styles.rankingItem} ${isSelected ? styles.rankingItemActive : ""}`}
                            onClick={() => handleSelectUser(item)}
                            title="Haz clic para proyectar su Radar de Riesgo (6 dimensiones)"
                          >
                            <span className={styles.rankingName}>
                              <span>{i + 1}. {item.nombre}</span>
                              <RoleBadge role={item.rol || item.role} size="small" />
                            </span>
                            <span className={styles.rankingValue}>
                              {typeof item.valor === "number" ? item.valor.toLocaleString() : item.valor}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Radar de Riesgo (aparece al seleccionar un usuario en los rankings) */}
          {selectedUserRadar && (
            <div ref={radarRef} className={styles.radarCard}>
              <div className={styles.radarHeader}>
                <div>
                  <h3 className={styles.radarTitle}>
                    <span>🎯</span> Radar de Riesgo (6 dimensiones): <strong>{selectedUserRadar.nombre}</strong>
                  </h3>
                
                </div>
                <button
                  type="button"
                  className={styles.closeRadarBtn}
                  onClick={() => setSelectedUserRadar(null)}
                  title="Cerrar Radar de Riesgo"
                >
                  ✕ Ocultar Radar
                </button>
              </div>
            
              <RadarRiesgo
                usuarios={radarUsuarios}
                activeUserId={selectedUserRadar.user_id || selectedUserRadar.nombre}
              />
            </div>
          )}

          <div className={styles.chartCard}>
            <h3>
              <span>📋</span> Tabla de Usuarios (clic en &quot;Ver&quot; para drill-down cronológico)
            </h3>
            <TablaUsuarios usuarios={data.usuarios} />
          </div>
        </>
      )}
    </div>
  );
}
