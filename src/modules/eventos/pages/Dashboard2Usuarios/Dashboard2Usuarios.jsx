import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  FaChartColumn,
  FaDatabase,
  FaFileShield,
  FaMoon,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";
import styles from "./dash2.module.css";
import TablaUsuarios from "../../componentes/TablaUsuarios/TablaUsuarios";
import RadarRiesgo from "../../componentes/RadarRiesgo/RadarRiesgo";
import RoleBadge from "../../../../components/RoleBadge";
import CardResumenEventos from "../../componentes/CardResumenEventos/CardResumenEventos";
import { useD2Usuarios, useD5Deteccion } from "../../../../api/apiEventos";

const MESES = [
  { value: "", label: "Todos los meses" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const RANKINGS = [
  {
    key: "mas_mb",
    title: "Mayor volumen transferido",
    description: "Usuarios con mayor volumen acumulado.",
    valueLabel: "MB",
    icon: FaDatabase,
    tone: "blue",
  },
  {
    key: "mas_secreto",
    title: "Más acceso a documentos secretos",
    description: "Usuarios con mayor actividad en documentos secretos.",
    valueLabel: "docs",
    icon: FaFileShield,
    tone: "red",
  },
  {
    key: "mas_fuera_horario",
    title: "Más actividad fuera de horario",
    description: "Usuarios con más eventos fuera de jornada.",
    valueLabel: "eventos",
    icon: FaMoon,
    tone: "amber",
  },
];

const formatoEntero = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 0 });
const formatoVolumen = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

function valorRanking(valor, clave) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return valor ?? "0";
  const formato = clave === "mas_mb" ? formatoVolumen : formatoEntero;
  const unidad = RANKINGS.find((ranking) => ranking.key === clave)?.valueLabel;
  return `${formato.format(numero)} ${unidad}`;
}

function RankingCard({ rankingDef, consulta, baseRanking, mesesRanking, cambiarMes, onSelectUser, selectedUser }) {
  const { key, title, description, valueLabel, icon: Icon, tone } = rankingDef;
  const ranking = consulta.data ? consulta.data.rankings?.[key] ?? [] : baseRanking ?? [];

  return (
    <article className={`${styles.rankingCard} ${styles[`ranking_${tone}`]}`}>
      <div className={styles.rankingHeader}>
        <div className={styles.rankingTitleBlock}>
          <span className={styles.rankingIcon} aria-hidden="true">
            <Icon />
          </span>
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        </div>
        <label className={styles.monthFilter} htmlFor={`periodo-${key}`}>
          <span>Periodo</span>
          <select id={`periodo-${key}`} value={mesesRanking[key]} onChange={(event) => cambiarMes(key, event.target.value)}>
            {MESES.map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {consulta.isFetching && (
        <p className={styles.rankingStatus} role="status">
          Actualizando periodo…
        </p>
      )}
      {consulta.isError && !consulta.data && (
        <p className={styles.rankingStatus} role="status">
          No se pudo actualizar el ranking; se muestran los datos generales.
        </p>
      )}

      {ranking.length > 0 ? (
        <ol className={styles.rankingsList} aria-label={title}>
          {ranking.map((item, index) => {
            const isSelected =
              selectedUser &&
              (String(selectedUser.user_id ?? "") === String(item.user_id ?? "") ||
                selectedUser.nombre === item.nombre);

            return (
              <li key={item.user_id ?? item.nombre ?? index}>
                <button
                  type="button"
                  className={`${styles.rankingItem} ${isSelected ? styles.rankingItemActive : ""}`}
                  onClick={() => onSelectUser(item)}
                  aria-pressed={Boolean(isSelected)}
                  title={`Comparar el perfil de ${item.nombre} en el radar`}
                >
                  <span className={styles.rankingPosition}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.rankingUser}>
                    <span className={styles.rankingName}>{item.nombre || "Usuario sin nombre"}</span>
                    <RoleBadge role={item.rol || item.role} size="small" />
                  </span>
                  <span className={styles.rankingValue}>{valorRanking(item.valor, key)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className={styles.rankingEmpty}>
          {consulta.isFetching ? "Cargando ranking…" : "No hay resultados para este periodo."}
        </div>
      )}

      <p className={styles.rankingFootnote}>
        Selecciona una fila para comparar el perfil de riesgo.
        <span>{valueLabel}</span>
      </p>
    </article>
  );
}

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
  const data = d2Q.data;
  const usuarios = data?.usuarios || [];
  const hasData = usuarios.length > 0;
  const consultasRanking = {
    mas_mb: mbQ,
    mas_secreto: secretoQ,
    mas_fuera_horario: fueraHorarioQ,
  };

  const resumen = useMemo(() => {
    const totalEventos = usuarios.reduce((total, user) => total + (Number(user.n_eventos) || 0), 0);
    const totalMb = usuarios.reduce((total, user) => total + (Number(user.total_mb) || 0), 0);
    const usuariosRiesgo = usuarios.filter((user) => ["alto", "critico"].includes(user.nivel_riesgo)).length;
    return { totalEventos, totalMb, usuariosRiesgo };
  }, [usuarios]);

  const cambiarMes = (key, mes) => {
    setMesesRanking((actual) => ({ ...actual, [key]: mes }));
  };

  const handleSelectUser = (item) => {
    const mismoUsuario =
      String(selectedUserRadar?.user_id ?? "") === String(item.user_id ?? "") &&
      selectedUserRadar?.nombre === item.nombre;

    if (mismoUsuario) {
      setSelectedUserRadar(null);
    } else {
      setSelectedUserRadar(item);
      window.setTimeout(() => {
        radarRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  // Combina la lista del dashboard con los perfiles ya calculados para el radar.
  const radarUsuarios = useMemo(() => {
    const baseRadar = d5Q.data?.radar_usuarios || [];
    const radarMap = new Map(baseRadar.map((user) => [String(user.user_id ?? user.nombre), user]));

    if (usuarios.length === 0 && baseRadar.length === 0) return [];

    const listaCompleta = usuarios.map((d2User) => {
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

      const n = Number(d2User.n_eventos) || 1;
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

    baseRadar.forEach((radarUser) => {
      const key = String(radarUser.user_id ?? radarUser.nombre);
      if (!listaCompleta.some((user) => String(user.user_id ?? user.nombre) === key)) {
        listaCompleta.push(radarUser);
      }
    });

    return listaCompleta.sort((a, b) => (b.score_riesgo || 0) - (a.score_riesgo || 0));
  }, [d5Q.data?.radar_usuarios, usuarios]);

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Análisis de actividad</p>
        <h1>Comportamiento por usuario</h1>
       
      </header>

      {d2Q.isLoading && !data && (
        <div className={styles.loadingState} role="status" aria-live="polite">
          <span className={styles.spinner} aria-hidden="true" />
          <div>
            <strong>Cargando perfiles</strong>
            <span>Estamos preparando los indicadores y rankings de actividad.</span>
          </div>
        </div>
      )}

      {d2Q.isError && !hasData && !d2Q.isLoading && (
        <div className={styles.emptyState} role="alert">
          <span className={styles.emptyIcon} aria-hidden="true">!</span>
          <h2>No se pudo cargar el análisis</h2>
          <p>Revisa la conexión e inténtalo nuevamente.</p>
          <button type="button" className={styles.retryButton} onClick={() => d2Q.refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {!d2Q.isLoading && !d2Q.isError && !hasData && (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon} aria-hidden="true"><FaUsers /></span>
          <h2>Aún no hay perfiles para mostrar</h2>
          <p>Carga un archivo de eventos para analizar la actividad por usuario.</p>
          <Link to="/carga_eventos" className={styles.emptyLink}>Ir a cargar eventos</Link>
        </div>
      )}

      {hasData && (
        <>
          <section className={styles.summarySection} aria-labelledby="usuarios-resumen-title">
            <div className={styles.sectionIntro}>
            
            </div>
            <div className={styles.kpiGrid}>
              <CardResumenEventos
                icon="usuarios"
                label="Usuarios analizados"
                value={formatoEntero.format(usuarios.length)}
                sub="Perfiles incluidos en el análisis"
              />
              <CardResumenEventos
                icon="total"
                label="Eventos registrados"
                value={formatoEntero.format(resumen.totalEventos)}
                sub="Actividad acumulada de los usuarios"
              />
              <CardResumenEventos
                icon="total"
                label="Volumen transferido"
                value={`${formatoVolumen.format(resumen.totalMb)} MB`}
                sub="Suma de los volúmenes por perfil"
              />
              <CardResumenEventos
                icon="anomalos"
                label="Riesgo alto o crítico"
                value={formatoEntero.format(resumen.usuariosRiesgo)}
                sub="Usuarios que requieren revisión"
              />
            </div>
          </section>

          {data.rankings && (
            <section className={styles.dashboardSection} aria-labelledby="usuarios-rankings-title">
              <div className={styles.sectionIntro}>
                <div>
                  <p className={styles.sectionEyebrow}>Comparación</p>
                  <h2 id="usuarios-rankings-title">Rankings de actividad</h2>
                  
                </div>
              </div>
              <div className={styles.chartsGrid}>
                {RANKINGS.map((rankingDef) => (
                  <RankingCard
                    key={rankingDef.key}
                    rankingDef={rankingDef}
                    consulta={
                      consultasRanking[rankingDef.key] || {
                        data: null,
                        isFetching: false,
                        isError: false,
                      }
                    }
                    baseRanking={data.rankings[rankingDef.key]}
                    mesesRanking={mesesRanking}
                    cambiarMes={cambiarMes}
                    onSelectUser={handleSelectUser}
                    selectedUser={selectedUserRadar}
                  />
                ))}
              </div>
            </section>
          )}

          {selectedUserRadar && (
            <section ref={radarRef} className={styles.radarCard} aria-labelledby="usuarios-radar-title">
              <div className={styles.radarHeader}>
                <div className={styles.radarTitleGroup}>
                  <span className={styles.radarIcon} aria-hidden="true"><FaChartColumn /></span>
                  <div>
                    <p className={styles.sectionEyebrow}>Perfil comparativo</p>
                    <h2 id="usuarios-radar-title" className={styles.radarTitle}>
                      Radar de riesgo
                    </h2>
                    <p className={styles.radarSubtitle}>
                      <strong>{selectedUserRadar.nombre}</strong>
                      {(selectedUserRadar.rol || selectedUserRadar.role) && (
                        <RoleBadge role={selectedUserRadar.rol || selectedUserRadar.role} size="small" />
                      )}
                      <span>Seis dimensiones normalizadas de 0 a 100</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.closeRadarBtn}
                  onClick={() => setSelectedUserRadar(null)}
                  aria-label="Cerrar comparación de riesgo"
                >
                  <FaXmark aria-hidden="true" />
                  <span>Cerrar radar</span>
                </button>
              </div>
              <RadarRiesgo
                usuarios={radarUsuarios}
                activeUserId={selectedUserRadar.user_id || selectedUserRadar.nombre}
              />
            </section>
          )}

          <section className={styles.tableSection} aria-labelledby="usuarios-tabla-title">
            <div className={styles.sectionIntro}>
              <div>
                <p className={styles.sectionEyebrow}>Detalle</p>
                <h2 id="usuarios-tabla-title">Todos los usuarios</h2>
                <p>Filtra por rol, revisa los indicadores y abre la cronología individual.</p>
              </div>
              <span className={styles.totalBadge}>{formatoEntero.format(usuarios.length)} perfiles</span>
            </div>
            <div className={styles.tableCard}>
              <TablaUsuarios usuarios={usuarios} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
