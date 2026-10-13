import { useState } from "react";
import { FaUserLock } from "react-icons/fa6";
import TablaBloqueos from "../componentes/tabla_bloqueos/TablaBloqueos";
import styles from "./cuentasBloqueadas.module.css";

const PESTANAS = [
  { id: "activos", titulo: "Cuentas bloqueadas", descripcion: "Bloqueadas automáticamente por un evento con score ≥ 75 %. Revisa el reporte forense antes de desbloquear." },
  { id: "historial", titulo: "Cuentas desbloqueadas", descripcion: "Historial de desbloqueos con el analista responsable y su justificación." },
];

export default function CuentasBloqueadasPage() {
  const [pestana, setPestana] = useState(PESTANAS[0]);
  return (
    <div className={styles.page}>
      <header>
        <h1><FaUserLock /> Contención de cuentas</h1>
        <p>Cuentas monitoreadas del dataset de eventos (ID_USER) bloqueadas por el motor de detección en tiempo real. No afecta las cuentas de acceso a esta aplicación.</p>
      </header>
      <nav className={styles.pestanas} aria-label="Estado de las cuentas">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" aria-pressed={pestana.id === p.id}
            className={pestana.id === p.id ? styles.activa : undefined} onClick={() => setPestana(p)}>{p.titulo}</button>
        ))}
      </nav>
      <TablaBloqueos key={pestana.id} estado={pestana.id} titulo={pestana.titulo} descripcion={pestana.descripcion} />
    </div>
  );
}
