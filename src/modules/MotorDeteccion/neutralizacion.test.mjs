import assert from "node:assert/strict";
import test from "node:test";
import { neutralizarAutomaticamente, solicitarBloqueoVerificado } from "./neutralizacion.js";
import { evaluarEstadoForense } from "./telemetria.js";

const critico = { id_user: 27, id_evento: 10, evento_registro_id: 901, name_user: "Ana", score_final: 0.91 };

test("el modo supervisado no ejecuta bloqueos, aunque lleguen eventos críticos", async () => {
  let solicitudes = 0;
  const neutralizar = () => { solicitudes += 1; };
  await neutralizarAutomaticamente(critico, false, neutralizar);
  await neutralizarAutomaticamente({ ...critico, nivel_riesgo: "critico" }, false, neutralizar);
  assert.equal(solicitudes, 0);
  assert.equal(evaluarEstadoForense(critico).esBloqueado, false);
});

test("activar y desactivar el modo automático controla las solicitudes posteriores", async () => {
  const recibidos = [];
  const neutralizar = async (evento) => recibidos.push(evento.id_evento);
  await neutralizarAutomaticamente(critico, true, neutralizar);
  await neutralizarAutomaticamente({ ...critico, score_final: 0.74 }, true, neutralizar);
  await neutralizarAutomaticamente({ ...critico, id_evento: 11 }, false, neutralizar);
  await neutralizarAutomaticamente({ ...critico, id_evento: 12, score_final: 0.75 }, true, neutralizar);
  assert.deepEqual(recibidos, [10, 12]);
});

test("un evento sin identidad persistida no llama al servidor", async () => {
  let solicitudes = 0;
  const post = () => { solicitudes += 1; };
  for (const evento of [{ ...critico, evento_registro_id: null }, { ...critico, id_user: null }]) {
    await assert.rejects(solicitarBloqueoVerificado(evento, "Riesgo crítico", post), /persistencia confirmada/);
  }
  assert.equal(solicitudes, 0);
});

test("la solicitud espera una confirmación explícita antes de acreditar el bloqueo", async () => {
  let confirmar;
  const respuesta = new Promise((resolve) => { confirmar = resolve; });
  let confirmado = false;
  const bloqueo = solicitarBloqueoVerificado(critico, "Revisión SOC", async (payload) => {
    assert.equal(payload.evento_registro_id, 901);
    assert.equal(payload.id_user, 27);
    return respuesta;
  }).then(() => { confirmado = true; });
  await Promise.resolve();
  assert.equal(confirmado, false);
  assert.equal(evaluarEstadoForense(critico).esBloqueado, false);
  confirmar({ confirmacion_bloqueo: true });
  await bloqueo;
  assert.equal(confirmado, true);
});

test("un rechazo o respuesta sin confirmación nunca acredita el bloqueo y permite reintentar", async () => {
  for (const resultado of [undefined, { status: "success" }, { confirmacion_bloqueo: false }, { confirmacion_bloqueo: "true" }]) {
    await assert.rejects(solicitarBloqueoVerificado(critico, "Riesgo", async () => resultado), /no confirmó/);
  }
  await assert.rejects(solicitarBloqueoVerificado(critico, "Riesgo", async () => { throw new Error("API caída"); }), /API caída/);
  const resultado = await solicitarBloqueoVerificado(critico, "Reintento SOC", async () => ({ confirmacion_bloqueo: true }));
  assert.equal(resultado.confirmacion_bloqueo, true);
});
