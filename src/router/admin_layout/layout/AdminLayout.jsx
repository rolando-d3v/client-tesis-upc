// import { motion } from "framer-motion";
// import css from "./homeRouter.module.scss";

// import LayoutProductosAdmin from "../../pages_admin/productos/LayoutProductosAdmin";
// import LayoutUsuariosAdmin from "../../../pages_admin/usuarios/LayoutUsuariosAdmin";

import { Outlet } from "react-router-dom";
import SidebarAdmin from "../sidebar/SidebarAdmin";
import styles from "./routerAdmin.module.css";

export default function AdminLayout() {
  return (
    <div className={css.admin}>
      <SidebarAdmin />

      <main  className={styles.main}  >
        <Outlet />
      </main>

      {/* <Routes>
        <Route path="/productos" element={<LayoutProductosAdmin />} />
        <Route path="/usuarios" element={<LayoutUsuariosAdmin />} />
      
      </Routes> */}
    </div>
  );
}
