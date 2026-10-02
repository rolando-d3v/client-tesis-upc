import assert from "node:assert/strict";
import test from "node:test";
import {
  acumularEvento,
  combinarResumenSOC,
  crearTelemetria,
  correlacionarEnVivo,
  listarIncidentesEnVivo,
  normalizarTipoEvento,
  parseFechaEvento,
  evaluarEstadoForense,
  convertirEventoAIncidente,
} from "./telemetria.js";

const evento = (cambios = {}) => ({
  fecha_evento: "2026-10-02T10:00:00",
  name_tipo_evento: "VISTA",
  nivel_riesgo: "bajo",
  es_anomalia: false,
  score_final: 0.1,
  id_user: 7,
  name_user: "Usuario de prueba",
  ...cambios,
});

const cantidad = (tipos, id) => tipos.find((tipo) => tipo.id === id).cantidad;

function congelar(valor) {
  Object.values(valor).forEach((item) => {
    if (item && typeof item === "object") congelar(item);
  });
  return Object.freeze(valor);
}

test("los acumulados conservan más de 300 eventos aunque el feed descarte filas", () => {
  const tipos = ["VISTA", "DESCARGAR", "EDITAR", "ELIMINAR", "GUARDAR_COPIA"];
  const niveles = ["critico", "alto", "medio", "bajo"];
  let telemetria = crearTelemetria();
  let feed = [];
  for (let index = 0; index < 360; index += 1) {
    const nuevo = evento({
      id_evento: index + 1,
      name_tipo_evento: tipos[index % tipos.length],
      nivel_riesgo: niveles[index % niveles.length],
      es_anomalia: index % niveles.length === 1,
      id_documento: index + 1, // cada amenaza es un par (documento, usuario) distinto
    });
    telemetria = acumularEvento(telemetria, nuevo);
    feed = [nuevo, ...feed].slice(0, 300);
  }

  const resumen = combinarResumenSOC({}, telemetria);
  assert.equal(feed.length, 300);
  assert.equal(resumen.total_eventos_analizados, 360);
  assert.equal(resumen.total_incidentes, 180);
  assert.equal(telemetria.criticos, 90);
  assert.equal(telemetria.anomalias, 90);
  assert.deepEqual(resumen.por_nivel_riesgo, { critico: 90, alto: 90, medio: 90, bajo: 90 });
  tipos.forEach((tipo) => assert.equal(cantidad(resumen.tipos_eventos, tipo), 72));
  assert.equal(resumen.evolucion_mensual[0].total, 360);
  assert.equal(resumen.evolucion_diaria[0].total, 360);
});

test("los períodos diarios y mensuales distinguen años y se ordenan cronológicamente", () => {
  const fechas = ["2026-10-02", "02/10/2025", "2026-09-30", "2025-10-02"];
  const telemetria = fechas.reduce((anterior, fecha_evento) =>
    acumularEvento(anterior, evento({ fecha_evento })), crearTelemetria());
  const resumen = combinarResumenSOC({}, telemetria);

  assert.deepEqual(resumen.evolucion_mensual.map(({ key, total }) => [key, total]), [
    ["2025-10", 2], ["2026-09", 1], ["2026-10", 1],
  ]);
  assert.deepEqual(resumen.evolucion_diaria.map(({ key, total }) => [key, total]), [
    ["2025-10-02", 2], ["2026-09-30", 1], ["2026-10-02", 1],
  ]);
  // El contrato del selector de tipos agrupa MM entre todos los años.
  assert.equal(cantidad(resumen.tipos_eventos_por_mes["10"], "VISTA"), 3);
});

test("el nombre del tipo prevalece sobre un ID predeterminado incorrecto", () => {
  const equivalencias = [
    ["DOWNLOAD", "DESCARGAR"], ["EDIT", "EDITAR"], ["DELETE", "ELIMINAR"],
    ["SAVE_COPY", "GUARDAR_COPIA"], ["READ", "VISTA"],
  ];
  let telemetria = crearTelemetria();
  equivalencias.forEach(([nombre, esperado]) => {
    assert.equal(normalizarTipoEvento(nombre, 1), esperado);
    telemetria = acumularEvento(telemetria, evento({ name_tipo_evento: nombre, id_tipo_evento: 1 }));
  });
  equivalencias.forEach(([, esperado]) => assert.equal(cantidad(telemetria.tipos_eventos, esperado), 1));
  assert.equal(normalizarTipoEvento("", 4), "ELIMINAR");
});

test("todos usa los mismos totales actualizados que tipos_eventos", () => {
  const base = {
    tipos_eventos: [{ id: "DESCARGAR", cantidad: 8 }],
    tipos_eventos_por_mes: {
      todos: [{ id: "DESCARGAR", cantidad: 2 }],
      "10": [{ id: "DESCARGAR", cantidad: 8 }],
    },
  };
  const telemetria = acumularEvento(crearTelemetria(), evento({ name_tipo_evento: "DOWNLOAD" }));
  const resumen = combinarResumenSOC(base, telemetria);
  assert.equal(cantidad(resumen.tipos_eventos, "DESCARGAR"), 9);
  assert.deepEqual(resumen.tipos_eventos_por_mes.todos, resumen.tipos_eventos);
  assert.equal(cantidad(resumen.tipos_eventos_por_mes["10"], "DESCARGAR"), 9);
});

test("el histórico con números serializados como texto se suma numéricamente", () => {
  const base = {
    total_eventos_analizados: "12", total_incidentes: "2",
    por_nivel_riesgo: { critico: "2", bajo: "10" },
    por_estado: { abierto: "1", contenido: "1" },
    por_clasificacion: { SECRETO: "2" },
    tipos_eventos: [{ id: "DESCARGAR", cantidad: "12" }],
    evolucion_mensual: [
      { key: "2025-10", label: "Oct", critico: "1", alto: "0", medio: "0", bajo: "0", total: "1" },
      { key: "2026-10", label: "Oct", critico: "1", alto: "0", medio: "0", bajo: "0", total: "1" },
    ],
    evolucion_diaria: [
      { key: "2025-10-02", label: "2 oct", critico: "1", alto: "0", medio: "0", bajo: "0", total: "1" },
      { key: "2026-10-02", label: "2 oct", critico: "1", alto: "0", medio: "0", bajo: "0", total: "1" },
    ],
  };
  const telemetria = acumularEvento(crearTelemetria(), evento({
    name_tipo_evento: "DOWNLOAD", nivel_riesgo: "critico", name_clasificacion: "SECRETO",
  }));
  const resumen = combinarResumenSOC(base, telemetria);
  assert.equal(resumen.total_eventos_analizados, 13);
  assert.equal(resumen.total_incidentes, 3);
  assert.equal(resumen.por_nivel_riesgo.critico, 3);
  assert.equal(resumen.por_nivel_riesgo.bajo, 10);
  assert.equal(resumen.por_estado.abierto, 2);
  assert.equal(resumen.por_estado.contenido, 1);
  assert.equal(resumen.por_clasificacion.SECRETO, 3);
  assert.equal(cantidad(resumen.tipos_eventos, "DESCARGAR"), 13);
  [resumen.evolucion_mensual, resumen.evolucion_diaria].forEach((periodos) => {
    assert.deepEqual(periodos.map((periodo) => periodo.total), [1, 2]);
    periodos.forEach((periodo) => ["critico", "alto", "medio", "bajo", "total"]
      .forEach((key) => assert.equal(typeof periodo[key], "number")));
  });
});

test("recombinar y neutralizar no muta los datos históricos ni duplica los tops", () => {
  const base = congelar({
    total_incidentes: 2,
    por_estado: { abierto: 2 },
    top_documentos: [{ id_documento: "42", incidentes: 2, max_score: 0.7 }],
    top_usuarios: [{ id_user: "7", incidentes: 2, max_score: 0.7 }],
  });
  const telemetria = congelar(acumularEvento(crearTelemetria(), evento({
    nivel_riesgo: "critico", id_documento: 42, score_final: 0.9,
  })));
  const copiaBase = structuredClone(base);
  const copiaVivo = structuredClone(telemetria);
  const inicial = combinarResumenSOC(base, telemetria);
  const repetido = combinarResumenSOC(base, telemetria);
  const neutralizado = combinarResumenSOC(base, telemetria, [7]);

  assert.deepEqual(inicial, repetido);
  assert.deepEqual(base, copiaBase);
  assert.deepEqual(telemetria, copiaVivo);
  assert.equal(neutralizado.top_documentos.length, 1);
  assert.equal(neutralizado.top_usuarios.length, 1);
  assert.equal(neutralizado.top_documentos[0].incidentes, 3);
  assert.equal(neutralizado.top_usuarios[0].incidentes, 3);
  assert.equal(neutralizado.top_documentos[0].max_score, 0.9);
  assert.deepEqual(neutralizado.top_documentos, inicial.top_documentos);
  assert.deepEqual(neutralizado.top_usuarios, inicial.top_usuarios);
  assert.equal(inicial.por_estado.abierto, 3);
  assert.equal(neutralizado.por_estado.abierto, 2);
  assert.equal(neutralizado.por_estado.contenido, 1);
  assert.equal(neutralizado.total_incidentes, 3);
});

test("neutralizar contabiliza amenazas que ya no están en el feed visible", () => {
  const amenaza = evento({ nivel_riesgo: "critico", id_user: 7 });
  let telemetria = acumularEvento(crearTelemetria(), amenaza);
  let feed = [amenaza];
  for (let index = 0; index < 301; index += 1) {
    const nuevo = evento({ id_user: 8 });
    telemetria = acumularEvento(telemetria, nuevo);
    feed = [nuevo, ...feed].slice(0, 300);
  }
  assert.equal(feed.some((item) => item.id_user === 7), false);
  const antes = combinarResumenSOC({}, telemetria);
  const despues = combinarResumenSOC({}, telemetria, ["7", "7"]);
  assert.equal(antes.por_estado.abierto, 1);
  assert.equal(despues.por_estado.abierto, 0);
  assert.equal(despues.por_estado.contenido, 1);
  assert.equal(despues.tasa_contencion_porcentaje, 100);
  assert.equal(despues.total_eventos_analizados, 302);
  assert.deepEqual(despues.tipos_eventos, antes.tipos_eventos);
  assert.deepEqual(despues.evolucion_mensual, antes.evolucion_mensual);
});

test("fechas inválidas usan un ahora explícito y estable", () => {
  const ahora = new Date(2026, 9, 2, 10);
  const esperado = parseFechaEvento("2026-10-02", ahora);
  [undefined, "", "sin fecha", "2026-02-30", "2025-02-29", "2026-13-01"].forEach((fecha) => {
    assert.deepEqual(parseFechaEvento(fecha, ahora), esperado);
  });
  assert.equal(parseFechaEvento("2024-02-29", ahora).diaKey, "2024-02-29");
  const telemetria = acumularEvento(crearTelemetria(), evento({ fecha_evento: "inválida" }), ahora);
  assert.equal(telemetria.evolucion_mensual[0].key, "2026-10");
  assert.equal(telemetria.evolucion_diaria[0].key, "2026-10-02");
});

test("crearTelemetria reinicia contadores sin compartir datos con la sesión anterior", () => {
  const inicial = congelar(crearTelemetria());
  const acumulada = acumularEvento(inicial, evento({ nivel_riesgo: "critico", name_tipo_evento: "DOWNLOAD" }));
  const limpia = crearTelemetria();
  assert.deepEqual(limpia, inicial);
  assert.equal(limpia.total_eventos_analizados, 0);
  assert.equal(limpia.total_incidentes, 0);
  assert.deepEqual(limpia.evolucion_mensual, []);
  assert.deepEqual(limpia.incidentes_por_usuario, {});
  limpia.tipos_eventos[0].cantidad = 5;
  assert.equal(cantidad(acumulada.tipos_eventos, "VISTA"), 0);
  assert.equal(cantidad(inicial.tipos_eventos, "VISTA"), 0);
  assert.equal(cantidad(acumulada.tipos_eventos, "DESCARGAR"), 1);
});

test("evaluarEstadoForense contiene automáticamente eventos críticos (Score >= 0.75 según constantes.py) y bloquea cuenta", () => {
  // Caso 1: Score crítico >= 0.75
  const incScoreCritico = {
    id: 101,
    id_user: 45,
    nombre_usuario: "Mendez",
    score_correlacion: 0.78,
    nivel_riesgo: "critico",
    estado: "abierto",
  };
  const eval1 = evaluarEstadoForense(incScoreCritico, []);
  assert.equal(eval1.esCritico, true);
  assert.equal(eval1.esBloqueado, true);
  assert.equal(eval1.estadoEfectivo, "contenido");

  // Caso 2: Evento leve (score 0.30, nivel medio)
  const incNormal = {
    id: 102,
    id_user: 50,
    nombre_usuario: "Perez",
    score_correlacion: 0.30,
    nivel_riesgo: "medio",
    estado: "abierto",
  };
  const eval2 = evaluarEstadoForense(incNormal, []);
  assert.equal(eval2.esCritico, false);
  assert.equal(eval2.esBloqueado, false);
  assert.equal(eval2.estadoEfectivo, "abierto");

  // Caso 3: Evento normal pero usuario en lista de neutralizadosIds
  const eval3 = evaluarEstadoForense(incNormal, ["50"]);
  assert.equal(eval3.esCritico, false);
  assert.equal(eval3.esBloqueado, true);
  assert.equal(eval3.estadoEfectivo, "contenido");
});

test("convertirEventoAIncidente auto-contiene en tiempo real y asigna cuenta_bloqueada si es crítico", () => {
  const evCritico = {
    id_evento: 999,
    id_user: 12,
    name_user: "Capitan Rivas",
    name_tipo_evento: "DOWNLOAD",
    name_clasificacion: "SECRETO",
    doc_interno_externo: "exterior",
    score_final: 0.88,
    nivel_riesgo: "critico",
  };

  const inc = convertirEventoAIncidente(evCritico);
  assert.equal(inc.estado, "contenido");
  assert.equal(inc.cuenta_bloqueada, true);
  assert.equal(inc.es_critico_auto, true);
  assert.ok(inc.accion_tomada.includes("Contención automática"));
  // Verifica que storyline incluya el paso de Contención Inmediata SOC
  assert.equal(inc.storyline.length, 4);
  assert.equal(inc.storyline[3].fase, "Contención Inmediata SOC");
});

test("la correlación cuenta un incidente por par documento+usuario, no uno por evento", () => {
  const mismoPar = (cambios = {}) => evento({
    id_documento: 42, id_user: 7, nivel_riesgo: "alto", es_anomalia: true, score_final: 0.6,
    name_clasificacion: "SECRETO", ...cambios,
  });
  let telemetria = crearTelemetria();
  for (let i = 0; i < 5; i += 1) telemetria = acumularEvento(telemetria, mismoPar({ id_evento: i }));
  telemetria = acumularEvento(telemetria, mismoPar({ id_evento: 99, nivel_riesgo: "critico", score_final: 0.95 }));
  telemetria = acumularEvento(telemetria, mismoPar({ id_documento: 43, id_evento: 100 })); // otro documento

  const resumen = combinarResumenSOC({}, telemetria);
  assert.equal(resumen.total_eventos_analizados, 7);      // los eventos sí se cuentan todos
  assert.equal(resumen.total_incidentes, 2);              // pero solo hay 2 pares
  assert.equal(resumen.por_clasificacion.SECRETO, 2);
  assert.equal(resumen.por_estado.abierto, 2);
  assert.equal(resumen.top_usuarios.length, 1);
  assert.equal(resumen.top_usuarios[0].incidentes, 2);
  assert.equal(resumen.top_usuarios[0].max_score, 0.95);  // el score máximo sí se actualiza
  assert.equal(resumen.top_documentos.length, 2);
  assert.ok(resumen.top_documentos.every((doc) => doc.incidentes === 1));
  assert.equal(combinarResumenSOC({}, telemetria, [7]).por_estado.contenido, 2);
});

test("correlacionarEnVivo mantiene un único incidente por par y conserva el más grave", () => {
  const congelado = congelar({});
  let mapa = congelado;
  mapa = correlacionarEnVivo(mapa, evento({ id_evento: 1, id_documento: 9, nivel_riesgo: "alto", score_final: 0.6, es_anomalia: true }), 1);
  mapa = correlacionarEnVivo(mapa, evento({ id_evento: 2, id_documento: 9, nivel_riesgo: "critico", score_final: 0.9 }), 2);
  mapa = correlacionarEnVivo(mapa, evento({ id_evento: 3, id_documento: 9, nivel_riesgo: "alto", score_final: 0.55, es_anomalia: true }), 3);
  mapa = correlacionarEnVivo(mapa, evento({ id_evento: 4, id_documento: 10, nivel_riesgo: "alto", score_final: 0.6, es_anomalia: true }), 4);
  assert.deepEqual(congelado, {});                         // no muta el mapa anterior
  const lista = listarIncidentesEnVivo(mapa);
  assert.equal(lista.length, 2);
  assert.equal(lista[0].id, "LIVE-10-7");                  // el más reciente primero
  const par9 = lista.find((inc) => inc.id === "LIVE-9-7");
  assert.equal(par9.total_eventos_asociados, 3);
  assert.equal(par9.nivel_riesgo, "critico");
  assert.equal(par9.score_correlacion, 0.9);
  assert.equal(par9.estado, "contenido");
  assert.equal(par9.cuenta_bloqueada, true);
  // un evento que no es amenaza no crea ni modifica incidentes
  assert.equal(correlacionarEnVivo(mapa, evento({ id_documento: 11 }), 5), mapa);
});

test("correlacionarEnVivo limita a 100 incidentes descartando el menos reciente", () => {
  let mapa = {};
  for (let i = 1; i <= 105; i += 1) {
    mapa = correlacionarEnVivo(mapa, evento({ id_documento: i, nivel_riesgo: "alto", score_final: 0.6 }), i);
  }
  const lista = listarIncidentesEnVivo(mapa);
  assert.equal(lista.length, 100);
  assert.equal(lista[0].id, "LIVE-105-7");
  assert.equal(lista.some((inc) => inc.id === "LIVE-1-7"), false);
});
