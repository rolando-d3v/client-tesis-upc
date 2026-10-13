import { useState } from "react";
import { toast } from "sonner";
import { FaLockOpen } from "react-icons/fa6";
import { useDesbloquearCuenta } from "../../../../api/apiContencion";
import { porcentaje } from "../../formato";
import styles from "./modalDesbloqueo.module.css";

const MIN_JUSTIFICACION = 10;

export default function ModalDesbloqueo({ bloqueo, onClose }) {
  const [justificacion, setJustificacion] = useState("");
  const desbloquear = useDesbloquearCuenta();
  const valida = justificacion.trim().length >= MIN_JUSTIFICACION;

  const confirmar = (e) => {
    e.preventDefault();
    if (!valida) return;
    desbloquear.mutate({ idUser: bloqueo.id_user, justificacion: justificacion.trim() }, {
      onSuccess: () => { toast.success(`Cuenta de ${bloqueo.nombre_usuario} desbloqueada`); onClose(); },
      onError: (error) => toast.error(error?.response?.data?.detail ?? "No se pudo desbloquear la cuenta."),
    });
  };

  return (
    <div className={styles.fondo} onClick={() => !desbloquear.isPending && onClose()}>
      <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-desbloqueo"
        onClick={(e) => e.stopPropagation()} onSubmit={confirmar}>
        <h3 id="titulo-desbloqueo"><FaLockOpen /> Desbloquear cuenta</h3>
        <p>
          <strong>{bloqueo.nombre_usuario}</strong> (ID {bloqueo.id_user}) fue bloqueado por el bloqueo {bloqueo.codigo}
          con un score de {porcentaje(bloqueo.score_final)}. La acción queda registrada con tu usuario y la justificación.
        </p>
        <label htmlFor="justificacion">Justificación del desbloqueo</label>
        <textarea id="justificacion" rows={4} autoFocus value={justificacion} maxLength={2000}
          placeholder="Ej.: La jefatura confirmó que la descarga masiva corresponde al cierre mensual autorizado."
          onChange={(e) => setJustificacion(e.target.value)} />
        <small>{valida ? "Listo para confirmar." : `Mínimo ${MIN_JUSTIFICACION} caracteres (${justificacion.trim().length}).`}</small>
        <div className={styles.acciones}>
          <button type="button" onClick={onClose} disabled={desbloquear.isPending}>Cancelar</button>
          <button type="submit" className={styles.confirmar} disabled={!valida || desbloquear.isPending}>
            {desbloquear.isPending ? "Desbloqueando…" : "Confirmar desbloqueo"}
          </button>
        </div>
      </form>
    </div>
  );
}
