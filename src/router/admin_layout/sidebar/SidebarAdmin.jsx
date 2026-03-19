import styles from "./sidebar.module.css";
import { Link } from "react-router-dom";

export default function SidebarAdmin() {
  const url = [
    { id: 1, url: "/admin/usuarios", name: "Usuarios" },
    { id: 2, url: "/admin/productos", name: "Productos" },
    { id: 3, url: "/admin/lista-productos", name: "Lista Productos" },
    { id: 4, url: "/admin/secciones-categorias", name: "Seccion y Categorias" },
  ];

  return (
    <aside className={styles.aside}>
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
    </aside>
  );
}
