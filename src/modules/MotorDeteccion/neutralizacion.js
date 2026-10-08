import { UMBRAL_CRITICO } from "./telemetria.js";

export function esEventoCritico(evento) {
  return String(evento?.nivel_riesgo || "").trim().toLowerCase() === "critico"
    || Number(evento?.score_final ?? 0) >= UMBRAL_CRITICO;
}

// El modo supervisado solo alerta; el operador ejecuta la acción manual.
export function neutralizarAutomaticamente(evento, modoAutomatico, neutralizar) {
  if (modoAutomatico !== true || !esEventoCritico(evento)) return;
  return neutralizar(evento, "Neutralización automática en tiempo real: amenaza crítica detectada (umbral 0.75).");
}

export async function solicitarBloqueoVerificado(evento, motivo, postNeutralizar) {
  const idUser = evento.id_user ?? evento.user_id;
  if (idUser == null || !evento.evento_registro_id) {
    throw new Error("El evento no tiene persistencia confirmada; no se puede verificar el bloqueo.");
  }
  const resultado = await postNeutralizar({
    id_evento: evento.id_evento,
    evento_registro_id: evento.evento_registro_id,
    id_user: idUser,
    nombre_usuario: evento.name_user || evento.nombre || "Usuario",
    motivo,
    responsable: "MOTOR_DETECCION_REALTIME",
  });
  if (resultado?.confirmacion_bloqueo !== true) {
    throw new Error("El servidor no confirmó el bloqueo de la cuenta.");
  }
  return resultado;
}
