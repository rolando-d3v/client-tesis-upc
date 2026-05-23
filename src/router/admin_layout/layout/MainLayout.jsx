
import { Outlet } from "react-router";
import SidebarAdmin from "../sidebar/SidebarAdmin";
import styles from "./routerAdmin.module.css";

export default function MainLayout() {
  return (
    <div className={styles.admin}>
      <SidebarAdmin />

      <main  className={styles.main}  >
        <Outlet />
      </main>

  
    </div>
  );
}
