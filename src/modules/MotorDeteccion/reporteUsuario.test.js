import assert from "node:assert/strict";
import test from "node:test";
import { resolverInformeUsuario, resolverReporteUsuario } from "./reporteUsuario.js";

test("abre el informe del bloqueo asociado al evento sin buscar otro del usuario", async () => {
  const id = await resolverReporteUsuario({ id_user: 7, bloqueo: { id: 21, id_user: 7 } }, () => {
    assert.fail("No debe reemplazar el reporte asociado al evento");
  });
  assert.equal(id, 21);
});

test("busca por ID de usuario para eventos normales o posteriores al bloqueo", async () => {
  let consultado;
  const id = await resolverReporteUsuario({ id_user: "7", nivel_riesgo: "bajo", cuenta_bloqueada: false }, async (usuario) => {
    consultado = usuario;
    return { id: 31, id_user: 7, activo: false };
  });
  assert.equal(consultado, 7);
  assert.equal(id, 31);
});

test("no abre el informe de otro usuario, aunque su nombre coincida", async () => {
  await assert.rejects(resolverReporteUsuario({ id_user: 7, name_user: "ANA" }, async () => ({ id: 31, id_user: 8 })), /este usuario/);
});

test("la ausencia de informe conserva el 404 para mostrar el aviso correspondiente", async () => {
  const error = { response: { status: 404 } };
  await assert.rejects(resolverReporteUsuario({ id_user: 7 }, async () => { throw error; }), (e) => e === error);
});

test("un evento sin usuario válido no realiza consultas", async () => {
  await assert.rejects(resolverReporteUsuario({ id_user: null }, () => assert.fail("No debe consultar")), /usuario válido/);
});

test("sin bloqueo abre un informe del evento persistido en vez de mostrar solo un aviso", async () => {
  const informe = { reporte: { usuario: { id_user: 7 }, metadata: { tipo_reporte: "consulta" } } };
  let consultado;
  const resultado = await resolverInformeUsuario({ id_user: 7, evento_registro_id: 55 },
    async () => { throw { response: { status: 404 } }; },
    async (id) => { consultado = id; return informe; });
  assert.equal(consultado, 55);
  assert.deepEqual(resultado, { informeConsulta: informe });
});

test("si existe bloqueo conserva su reporte original sin generar una consulta", async () => {
  const resultado = await resolverInformeUsuario({ id_user: 7, bloqueo: { id: 21, id_user: 7 } },
    () => assert.fail("No debe buscar otro bloqueo"), () => assert.fail("No debe generar consulta"));
  assert.deepEqual(resultado, { idBloqueo: 21 });
});

test("fallos de autorización no se confunden con ausencia de bloqueo", async () => {
  const error = { response: { status: 401 } };
  await assert.rejects(resolverInformeUsuario({ id_user: 7, evento_registro_id: 55 },
    async () => { throw error; }, () => assert.fail("No debe consultar")), (e) => e === error);
});

test("no presenta como forense un evento que no se haya guardado", async () => {
  await assert.rejects(resolverInformeUsuario({ id_user: 7 },
    async () => { throw { response: { status: 404 } }; }, () => assert.fail("No debe consultar")),
    (e) => e.code === "SIN_EVIDENCIA_PERSISTIDA");
});
