import styles from "./sidebar.module.css";
import logo from "../../../assets/logos/machine.png";
import { Link, useNavigate, useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { xlogin_false } from "../../../Redux/slice/usuarioAuthSlice";
import { logoutAuth } from "../../../api/apiAuthLogin";
import {
  FaChartLine,
  FaPowerOff,
  FaFileCsv,
  FaUsers,
  FaShieldHalved,
  FaBrain,
  FaBolt,
} from "react-icons/fa6";

export default function SidebarAdmin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();


  const eventosLinks = [
    { id: 6, url: "/entrenamiento", name: "Entrenamiento de eventos", icon: <FaBrain /> },
    { id: 7, url: "/eventos/motor-deteccion", name: "Detección en tiempo real", icon: <FaBolt /> },
    {
      id: 1,
      url: "/carga_eventos",
      name: "Cargar dataset de eventos",
      icon: <FaFileCsv />,
    },
    {
      id: 3,
      url: "/eventos/usuarios",
      name: "Actividad por usuario",
      icon: <FaUsers />,
    },
    {
      id: 5,
      url: "/eventos/clasificacion",
      name: "Análisis de eventos",
      icon: <FaShieldHalved />,
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

  return (
    <aside className={styles.aside}>
      <div className={styles.divLogo}>
        <img src={logo} alt="logo_machine" />
        <span>Sistema Predictivo</span>
      </div>

     

      <hr className={styles.divider} />

      <div className={styles.sectionTitle}>Dataset de eventos</div>

      <div className={styles.listUrl}>
        {eventosLinks.map((link) => (
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

      <div className={styles.sectionTitle} style={{ color: "#7c3aed" }}>
        Ensemble de modelos
      </div>
      <div style={{ padding: "8px 12px", color: "#cbd5e1", fontSize: "0.78rem", lineHeight: 1.6 }}>
        <div><FaChartLine style={{ marginRight: 7, color: "#38bdf8" }} />Isolation Forest · 40%</div>
        <div><FaChartLine style={{ marginRight: 7, color: "#c084fc" }} />LSTM Autoencoder · 60%</div>
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
