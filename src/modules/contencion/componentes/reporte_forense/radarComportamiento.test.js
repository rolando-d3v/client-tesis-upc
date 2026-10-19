import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { datosRadarComportamiento } from "./radarComportamiento.js";

function reporte() {
  return {
    actividad_reciente: { total_eventos: 20, fuera_de_horario: 8, acciones_alto_impacto: 5,
      por_clasificacion: { SECRETO: 10, RESERVADO: 10 } },
    evaluacion_modelos: { score_final: 0.82, isolation_forest: { score: 0.3, peso: 0.4 },
      lstm_autoencoder: { score: 0.9, peso: 0.6 } },
  };
}

test("usa proporciones de la evidencia y puntuaciones del evento, sin confundirlas con los pesos", () => {
  const datos = datosRadarComportamiento(reporte());
  assert.deepEqual(datos.map((d) => d.valor), [40, 50, 25, 30, 90, 82]);
  assert.deepEqual(datos.slice(0, 3).map((d) => d.unidad), ["%", "%", "%"]);
  assert.deepEqual(datos.slice(3).map((d) => d.unidad), ["/ 100", "/ 100", "/ 100"]);
});

test("reportes anteriores funcionan sin agregar campos ni alterar el contenido sellado", () => {
  const original = reporte();
  const serializado = JSON.stringify(original);
  const hash = (texto) => createHash("sha256").update(texto).digest("hex");
  datosRadarComportamiento(original);
  assert.equal(JSON.stringify(original), serializado);
  assert.equal(hash(JSON.stringify(original)), hash(serializado));
});

test("actividad ausente o vacía se representa sin datos, no como comportamiento de valor cero", () => {
  for (const actividad of [undefined, { total_eventos: 0, fuera_de_horario: 0, acciones_alto_impacto: 0, por_clasificacion: {} }]) {
    const datos = datosRadarComportamiento({ ...reporte(), actividad_reciente: actividad });
    assert.deepEqual(datos.slice(0, 3).map((d) => d.valor), [null, null, null]);
    assert.deepEqual(datos.slice(3).map((d) => d.valor), [30, 90, 82]);
  }
});

test("un cero observado se conserva y no se confunde con evidencia faltante", () => {
  const datos = datosRadarComportamiento({ ...reporte(), actividad_reciente: {
    total_eventos: 10, fuera_de_horario: 0, acciones_alto_impacto: 0, por_clasificacion: { COMUN: 10 },
  } });
  assert.deepEqual(datos.slice(0, 3).map((d) => d.valor), [0, 0, 0]);
});

test("valores imposibles o no finitos no inventan puntos en el radar", () => {
  const datos = datosRadarComportamiento({ actividad_reciente: { total_eventos: 10, fuera_de_horario: 11 },
    evaluacion_modelos: { score_final: NaN, isolation_forest: { score: -0.2 }, lstm_autoencoder: { score: Infinity } } });
  assert.ok(datos.every((d) => d.valor === null));
});

test("incluye las cuatro acciones de impacto cuando el reporte solo conserva el desglose", () => {
  const datos = datosRadarComportamiento({ ...reporte(), actividad_reciente: { total_eventos: 10,
    por_accion: { DESCARGAR: 2, EDITAR: 1, ELIMINAR: 1, GUARDAR_COPIA: 1, VISTA: 5 } } });
  assert.equal(datos.find((d) => d.id === "impacto").valor, 50);
});
