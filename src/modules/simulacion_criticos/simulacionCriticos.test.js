import assert from "node:assert/strict";
import test from "node:test";
import { acumulados, filtrarCriticos, histogramaScore, porTipo, serieRecall } from "./simulacionCriticos.js";

const eventos = [
  { id_evento: 1, detectado: true, politica: true, alcanza_bloqueo: true, score_final: 0.9, tipo_anomalia: "clasificado_sin_privilegio", name_user: "ANA" },
  { id_evento: 2, detectado: false, politica: false, alcanza_bloqueo: false, score_final: 0.31, tipo_anomalia: "rafaga_descargas", name_user: "LUIS" },
  { id_evento: 3, detectado: true, politica: false, alcanza_bloqueo: true, score_final: 0.8, tipo_anomalia: "rafaga_descargas", name_user: "ANA" },
];

test("los acumulados cuadran con los totales al final de la reproducción", () => {
  const serie = acumulados(eventos);
  assert.equal(serie.length, eventos.length + 1);
  assert.deepEqual(serie[0], { procesados: 0, detectados: 0, omitidos: 0, bloqueos: 0, politica: { total: 0, detectados: 0 }, comportamiento: { total: 0, detectados: 0 } });
  const final = serie.at(-1);
  assert.equal(final.detectados + final.omitidos, final.procesados);
  assert.deepEqual([final.detectados, final.omitidos, final.bloqueos], [2, 1, 2]);
  assert.deepEqual(final.politica, { total: 1, detectados: 1 });
  assert.deepEqual(final.comportamiento, { total: 2, detectados: 1 });
});

test("cada posición acumulada es independiente: avanzar no modifica las anteriores", () => {
  const serie = acumulados(eventos);
  assert.deepEqual(serie[1].comportamiento, { total: 0, detectados: 0 });
});

test("el recall acumulado se calcula solo sobre los eventos ya reproducidos", () => {
  const serie = acumulados(eventos);
  assert.deepEqual(serieRecall(eventos, serie, 2).map((p) => p.recall), [100, 50]);
});

test("agrupa por tipo y cuenta detectados y omitidos", () => {
  assert.deepEqual(porTipo(eventos)[0], { tipo: "rafaga_descargas", etiqueta: "Ráfaga de descargas", detectados: 1, omitidos: 1 });
});

test("el histograma ubica cada score en su intervalo, incluido el 1.0 en el último", () => {
  const bins = histogramaScore([...eventos, { detectado: true, score_final: 1 }], 0.05);
  assert.equal(bins.length, 20);
  assert.equal(bins[6].omitidos, 1); // 0.31 → 0.30–0.35
  assert.equal(bins[19].detectados, 1);
});

test("filtra por resultado, origen y texto", () => {
  assert.deepEqual(filtrarCriticos(eventos, { resultado: "omitido" }).map((e) => e.id_evento), [2]);
  assert.deepEqual(filtrarCriticos(eventos, { origen: "politica" }).map((e) => e.id_evento), [1]);
  assert.deepEqual(filtrarCriticos(eventos, { busqueda: "ana", origen: "comportamiento" }).map((e) => e.id_evento), [3]);
  const conNivel = eventos.map((e) => ({ ...e, nivel_riesgo: e.score_final >= 0.75 ? "critico" : "medio" }));
  assert.deepEqual(filtrarCriticos(conNivel, { nivel_riesgo: "medio" }).map((e) => e.id_evento), [2]);
});
