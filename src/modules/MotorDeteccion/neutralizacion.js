import { UMBRAL_CRITICO } from "./telemetria.js";

export function esEventoCritico(evento) {
  return String(evento?.nivel_riesgo || "").trim().toLowerCase() === "critico"
    || Number(evento?.score_final ?? 0) >= UMBRAL_CRITICO;
}

// Score total del par (documento, usuario): correlación T+E que calcula el backend en vivo
export function scoreTotal(correlacion) {
  const score = Number(correlacion?.score_correlacion);
  return Number.isFinite(score) ? score : null;
}

// Amenaza crítica: el evento es crítico o el score total de la correlación es ≥ 0.75 (crítico).
export function esAmenazaCritica(evento, correlacion = null) {
  const total = scoreTotal(correlacion);
  return esEventoCritico(evento)
    || (total !== null && total >= UMBRAL_CRITICO)
    || String(correlacion?.nivel_riesgo || "").trim().toLowerCase() === "critico";
}

// El modo supervisado solo alerta; el operador ejecuta la acción manual.
export function neutralizarAutomaticamente(evento, correlacion, modoAutomatico, neutralizar) {
  if (modoAutomatico !== true || !esAmenazaCritica(evento, correlacion)) return;
  const total = scoreTotal(correlacion);
  const detalle = total !== null && total >= UMBRAL_CRITICO
    ? `score total ${total.toFixed(2)} ≥ ${UMBRAL_CRITICO}`
    : `score del evento ${Number(evento?.score_final ?? 0).toFixed(2)} ≥ ${UMBRAL_CRITICO}`;
  return neutralizar(evento, `Neutralización automática en tiempo real: amenaza crítica (${detalle}).`);
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
