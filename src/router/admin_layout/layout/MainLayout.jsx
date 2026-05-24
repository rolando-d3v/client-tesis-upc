
import { Outlet } from "react-router";
import SidebarAdmin from "../sidebar/SidebarAdmin";
import styles from "./routerAdmin.module.css";
import Navigator from "../navigator/Navigator";

export default function MainLayout() {
  return (
    <div className={styles.admin}>

      {/* <Navigator /> */}
      <SidebarAdmin />

      <main  className={styles.main}  >
        <Outlet />
      </main>

  
    </div>
  );
}
