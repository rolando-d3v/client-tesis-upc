import styles from "./routerHome.module.css";
import { Outlet } from "react-router";
import Navigator from "../navigator/Navigator";

export default function RootLayout() {
  // La verificación de auth ahora la maneja AuthProvider en main.jsx

  return (
    <div className={`${styles.theme} `}>
      <Navigator />
      <main className={styles.main_x}>
        <Outlet />
      </main>
    </div>
  );
}
