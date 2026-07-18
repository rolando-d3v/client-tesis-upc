import styles from "./sidebar.module.css";
import logo from "../../../assets/logos/machine.png";
import { Link, useNavigate, useLocation } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { xlogin_false } from "../../../Redux/slice/usuarioAuthSlice";
import {
  setFechaInicio,
  setFechaFin,
  limpiarFechas,
} from "../../../Redux/slice/filtroFechasSlice";
import { logoutAuth } from "../../../api/apiAuthLogin";
import {
  FaChartLine,
  FaTable,
  FaCalendar,
  FaPowerOff,
  FaEraser,
  FaFileCsv,
  FaUsers,
  FaClock,
  FaShieldHalved,
  FaBrain,
  FaUserShield,
} from "react-icons/fa6";

export default function SidebarAdmin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { fechaInicio, fechaFin } = useSelector((state) => state.FILTRO_FECHAS);

  const anomaliasLinks = [
    {
      id: 9,
      url: "/carga_anomalias",
      name: "Cargar CSV",
      icon: <FaFileCsv />,
    },
    {
      id: 10,
      url: "/anomalias",
      name: "Dashboard Anomalías",
      icon: <FaChartLine />,
    },
    {
      id: 11,
      url: "/anomalias/tabla",
      name: "Tabla Anomalías",
      icon: <FaTable />,
    },
    {
      id: 12,
      url: "/anomalias/timeline",
      name: "Timeline",
      icon: <FaCalendar />,
    },
  ];

  const anomaliasEventos = [
    {
      id: 1,
      url: "/carga_eventos",
      name: "Cargar CSV Eventos",
      icon: <FaFileCsv />,
    },
    {
      id: 2,
      url: "/eventos/dashboard-ejecutivo",
      name: "Resumen Ejecutivo",
      icon: <FaChartLine />,
    },
    {
      id: 3,
      url: "/eventos/usuarios",
      name: "Por Usuario",
      icon: <FaUsers />,
    },
    {
      id: 4,
      url: "/eventos/temporal",
      name: "Actividad Temporal",
      icon: <FaClock />,
    },
    {
      id: 5,
      url: "/eventos/clasificacion",
      name: "Clasificación Doc.",
      icon: <FaShieldHalved />,
    },
    {
      id: 6,
      url: "/eventos/deteccion",
      name: "Motor Detección",
      icon: <FaBrain />,
    },
    {
      id: 7,
      url: "/eventos/perfiles",
      name: "Perfiles Usuario",
      icon: <FaUserShield />,
    },
  ];

  const handleLogout = async () => {
    try {
      await logoutAuth();
    } catch (error) {
      console.error("Logout error:", error);
    }
    dispatch(xlogin_false());
    navigate("/");
  };

  const handleLimpiar = () => {
    dispatch(limpiarFechas());
  };

  const tieneFiltroDeFecha = fechaInicio || fechaFin;

  return (
    <aside className={styles.aside}>
      <div className={styles.divLogo}>
        <img src={logo} alt="logo_machine" />
        <span>Sistema Predictivo</span>
      </div>

      {/* <hr className={styles.divider} /> */}

      {/* ---- Filtro de Fechas ---- */}
      {/* <div className={styles.filterSection}>
        <div className={styles.filterHeader}>
          <span className={styles.filterTitle}>Filtrar por Fecha</span>
          {tieneFiltroDeFecha && (
            <span className={styles.filterBadge}>Activo</span>
          )}
        </div>

        <label className={styles.filterLabel} htmlFor="sidebar-fecha-inicio">
          Desde
        </label>
        <input
          type="date"
          id="sidebar-fecha-inicio"
          className={styles.filterInput}
          value={fechaInicio || ""}
          onChange={(e) => dispatch(setFechaInicio(e.target.value))}
        />

        <label className={styles.filterLabel} htmlFor="sidebar-fecha-fin">
          Hasta
        </label>
        <input
          type="date"
          id="sidebar-fecha-fin"
          className={styles.filterInput}
          value={fechaFin || ""}
          min={fechaInicio || undefined}
          onChange={(e) => dispatch(setFechaFin(e.target.value))}
        />

        <button
          className={styles.filterBtnTotal}
          onClick={handleLimpiar}
          title="Mostrar todos los datos sin filtro de fecha"
        >
          <FaEraser />
          Total
        </button>
      </div> */}

      <hr className={styles.divider} />

      <div className={styles.sectionTitle}>Trazabilidad de documentos</div>

      <div className={styles.listUrl}>
        {anomaliasLinks.map((link) => (
          <Link
            key={link.id}
            className={`${styles.link} ${
              location.pathname === link.url ? styles.linkActive : ""
            }`}
            to={link.url}
          >
            <span className={styles.icon}>{link.icon}</span>
            {link.name}
          </Link>
        ))}
      </div>

      <hr className={styles.divider} />

      <div className={styles.sectionTitle}  >Eventos de usuarios</div>

      <div className={styles.listUrl}>
        {anomaliasEventos?.map((link) => (
          <Link
            key={link.id}
            className={`${styles.link} ${
              location.pathname === link.url ? styles.linkActive : ""
            }`}
            to={link.url}
          >
            <span className={styles.icon}>{link.icon}</span>
            {link.name}
          </Link>
        ))}
      </div>

      <div className={styles.spacer}>
        <hr className={styles.divider} />
        <button
          onClick={handleLogout}
          className={`${styles.link} ${styles.logoutBtn}`}
        >
          <span className={`${styles.icon} ${styles.logoutIcon}`}>
            <FaPowerOff />
          </span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
