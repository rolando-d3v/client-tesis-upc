import { useState } from "react";
import { FaFileShield, FaLock, FaLockOpen } from "react-icons/fa6";
import { useBloqueos } from "../../../../api/apiContencion";
import ReporteForense from "../reporte_forense/ReporteForense";
import ModalDesbloqueo from "../modal_desbloqueo/ModalDesbloqueo";
import { fechaHora, porcentaje } from "../../formato";
import BadgeNivel from "../../../../components/nivel_riesgo/BadgeNivel";
import { nivelDeScore } from "../../../../config/nivelesRiesgo";
import styles from "./tablaBloqueos.module.css";

export default function TablaBloqueos({ estado = "activos", titulo, descripcion, compacta = false }) {
  const { data: bloqueos = [], isLoading, isError } = useBloqueos(estado);
  const [reporte, setReporte] = useState(null);
  const [desbloqueo, setDesbloqueo] = useState(null);

  return (
    <section className={styles.panel}>
      <header className={styles.cabecera}>
        <div>
          <h2>{estado === "activos" ? <FaLock /> : <FaLockOpen />} {titulo}</h2>
          {descripcion && <p>{descripcion}</p>}
        </div>
        <span className={bloqueos.length && estado === "activos" ? styles.contadorAlerta : styles.contador}>{bloqueos.length}</span>
      </header>
      {isLoading && <p className={styles.vacio}>Cargando…</p>}
      {isError && <p className={styles.vacio}>No se pudieron consultar los bloqueos.</p>}
      {!isLoading && !isError && !bloqueos.length && (
        <p className={styles.vacio}>{estado === "activos" ? "No hay cuentas bloqueadas." : "Todavía no hay cuentas desbloqueadas."}</p>
      )}
      {bloqueos.length > 0 && (
        <div className={styles.scroll} style={compacta ? { maxHeight: 320 } : undefined}>
          <table>
            <thead>
              <tr>
                <th>Código</th><th>Usuario</th><th>Bloqueo</th><th>Score</th><th>Motivos principales</th>
                {estado !== "activos" && <th>Desbloqueo</th>}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bloqueos.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.codigo}</strong></td>
                  <td>{b.nombre_usuario}<small>ID {b.id_user}</small></td>
                  <td>{fechaHora(b.fecha_bloqueo)}<small>{b.origen}</small></td>
                  <td><BadgeNivel nivel={nivelDeScore(b.score_final)}>{porcentaje(b.score_final)}</BadgeNivel></td>
                  <td className={styles.motivos}>{b.motivos_principales.map((m) => <span key={m}>{m}</span>)}</td>
                  {estado !== "activos" && <td>{fechaHora(b.fecha_desbloqueo)}<small>{b.desbloqueado_por}</small></td>}
                  <td className={styles.acciones}>
                    <button type="button" onClick={() => setReporte(b.id)}><FaFileShield /> Reporte forense</button>
                    {b.activo && <button type="button" className={styles.desbloquear} onClick={() => setDesbloqueo(b)}><FaLockOpen /> Desbloquear</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {reporte && <ReporteForense idBloqueo={reporte} onClose={() => setReporte(null)} />}
      {desbloqueo && <ModalDesbloqueo bloqueo={desbloqueo} onClose={() => setDesbloqueo(null)} />}
    </section>
  );
}
