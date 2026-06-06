import styles from "./sidebar.module.css";
import { Link, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { xlogin_false } from "../../../Redux/slice/usuarioAuthSlice";
import { logoutAuth } from "../../../api/apiAuthLogin";
import * as FaIcons from "react-icons/fa6";

export default function SidebarAdmin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const url = [
    { id: 1, url: "/user", name: "Usuarios" },
    { id: 2, url: "/user/tabla", name: "Productos" },
    { id: 3, url: "/admin/lista-productos", name: "Lista Productos" },
    { id: 4, url: "/admin/secciones-categorias", name: "Seccion y Categorias" },
  ];

  const anomaliasLinks = [
    { id: 10, url: "/anomalias", name: "🔍 Dashboard Anomalías" },
    { id: 11, url: "/anomalias/tabla", name: "📋 Tabla Anomalías" },
    { id: 12, url: "/anomalias/timeline", name: "📅 Timeline" },
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
    <aside className={styles.aside} style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div className={styles.div_logo}>Panel Administrador</div>
      <hr />

      <div className={styles.list_url}>
        {url.map((pro, i) => {
          return (
            <Link key={i} className={styles.link} to={pro.url}>
              {pro.name}
            </Link>
          );
        })}
      </div>

      <hr style={{ margin: "0.75rem 0", borderColor: "rgba(148,163,184,0.1)" }} />
      <div className={styles.div_logo} style={{ fontSize: "0.8rem", opacity: 0.7 }}>
        Isolation Forest
      </div>

      <div className={styles.list_url}>
        {anomaliasLinks.map((link) => (
          <Link key={link.id} className={styles.link} to={link.url}>
            {link.name}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: "auto", marginBottom: "2rem" }}>
        <hr style={{ margin: "1rem 0", borderColor: "rgba(148,163,184,0.1)" }} />
        <button
          onClick={handleLogout}
          className={styles.link}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            color: "#ff4d4f",
            padding: "10px"
          }}
        >
          <FaIcons.FaPowerOff /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
