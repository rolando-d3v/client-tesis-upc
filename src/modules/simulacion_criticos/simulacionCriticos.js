// Lógica pura de la simulación de eventos críticos: sin React ni DOM, para poder probarla con Node.
// Los eventos llegan del backend (GET /evaluacion/criticos) en orden cronológico, con la decisión que tomó
// el ensemble en la evaluación. La simulación solo los reproduce: no vuelve a puntuar nada.

// Etiquetas cortas (≤ 24 caracteres): se usan como ejes de gráfico y deben caber también en móvil.
export const TIPOS_ANOMALIA = {
  clasificado_sin_privilegio: { etiqueta: "Clasificado sin privilegio", categoria: "Política" },
  tamano_extremo: { etiqueta: "Tamaño extremo", categoria: "Puntual" },
  hora_inusual: { etiqueta: "Hora inusual", categoria: "Puntual" },
  oficina_documento_ajeno: { etiqueta: "Oficina/documento ajeno", categoria: "Puntual" },
  fin_de_semana: { etiqueta: "Fin de semana", categoria: "Puntual" },
  rafaga_descargas: { etiqueta: "Ráfaga de descargas", categoria: "Secuencial" },
  eliminacion_masiva: { etiqueta: "Eliminación masiva", categoria: "Secuencial" },
  recorrido_documentos: { etiqueta: "Recorrido de documentos", categoria: "Secuencial" },
  patron_vista_descarga_eliminar: { etiqueta: "Vista → descarga → elim.", categoria: "Secuencial" },
  cambio_ritmo: { etiqueta: "Cambio de ritmo", categoria: "Secuencial" },
};

export const etiquetaTipo = (tipo) => TIPOS_ANOMALIA[tipo]?.etiqueta ?? (tipo ? String(tipo).replaceAll("_", " ") : "Sin tipo");

// Velocidades de reproducción: `ms` entre pasos y `paso` = eventos que avanza cada paso.
export const VELOCIDADES = [
  { id: "1", etiqueta: "1 evento/s", ms: 1000, paso: 1 },
  { id: "5", etiqueta: "5 eventos/s", ms: 200, paso: 1 },
  { id: "20", etiqueta: "20 eventos/s", ms: 50, paso: 1 },
  { id: "100", etiqueta: "100 eventos/s", ms: 50, paso: 5 },
];

export const cociente = (parte, total) => (total > 0 ? parte / total : null);

/**
 * Contadores acumulados: la posición i resume los primeros i eventos (la 0 es el estado inicial).
 * Se calcula una sola vez por paquete; cada paso de la simulación solo lee una posición.
 */
export function acumulados(eventos = []) {
  let actual = {
    procesados: 0,
    detectados: 0,
    omitidos: 0,
    bloqueos: 0,
    politica: { total: 0, detectados: 0 },
    comportamiento: { total: 0, detectados: 0 },
  };
  const serie = [actual];
  for (const evento of eventos) {
    const detectado = Boolean(evento.detectado);
    const origen = evento.politica ? "politica" : "comportamiento";
    actual = {
      procesados: actual.procesados + 1,
      detectados: actual.detectados + Number(detectado),
      omitidos: actual.omitidos + Number(!detectado),
      bloqueos: actual.bloqueos + Number(Boolean(evento.alcanza_bloqueo)),
      politica: { ...actual.politica },
      comportamiento: { ...actual.comportamiento },
    };
    actual[origen].total += 1;
    actual[origen].detectados += Number(detectado);
    serie.push(actual);
  }
  return serie;
}

/** Recall acumulado (en %) tras cada evento procesado, para el gráfico de evolución. */
export function serieRecall(eventos, acumulado, indice) {
  const puntos = [];
  for (let i = 1; i <= indice; i += 1) {
    const { detectados, procesados } = acumulado[i];
    puntos.push({ orden: i, recall: (detectados / procesados) * 100, id_evento: eventos[i - 1]?.id_evento });
  }
  return puntos;
}

/** Detectados y omitidos por tipo de anomalía, de mayor a menor volumen. */
export function porTipo(eventos = []) {
  const grupos = new Map();
  for (const evento of eventos) {
    const clave = evento.tipo_anomalia || "sin_tipo";
    const grupo = grupos.get(clave) ?? { tipo: clave, etiqueta: etiquetaTipo(evento.tipo_anomalia), detectados: 0, omitidos: 0 };
    grupo[evento.detectado ? "detectados" : "omitidos"] += 1;
    grupos.set(clave, grupo);
  }
  return [...grupos.values()].sort((a, b) => b.detectados + b.omitidos - (a.detectados + a.omitidos));
}

/** Histograma del score final en intervalos de `ancho`, separando detectados y omitidos. */
export function histogramaScore(eventos = [], ancho = 0.05) {
  const cubetas = Math.round(1 / ancho);
  const bins = Array.from({ length: cubetas }, (_, i) => ({
    desde: Number((i * ancho).toFixed(2)),
    centro: Number(((i + 0.5) * ancho).toFixed(3)), // posición de la barra en un eje numérico 0–1
    etiqueta: `${(i * ancho).toFixed(2)}–${((i + 1) * ancho).toFixed(2)}`,
    detectados: 0,
    omitidos: 0,
  }));
  for (const evento of eventos) {
    const score = Number(evento.score_final);
    if (!Number.isFinite(score)) continue;
    const i = Math.min(cubetas - 1, Math.max(0, Math.floor(score / ancho)));
    bins[i][evento.detectado ? "detectados" : "omitidos"] += 1;
  }
  return bins;
}

/** Filtros de la tabla: resultado (detectado/omitido), origen (politica/comportamiento), nivel de riesgo y texto libre. */
export function filtrarCriticos(eventos = [], { resultado = "", origen = "", nivel_riesgo = "", busqueda = "" } = {}) {
  const texto = busqueda.trim().toLowerCase();
  return eventos.filter((e) => {
    if (nivel_riesgo && e.nivel_riesgo !== nivel_riesgo) return false;
    if (resultado === "detectado" && !e.detectado) return false;
    if (resultado === "omitido" && e.detectado) return false;
    if (origen === "politica" && !e.politica) return false;
    if (origen === "comportamiento" && e.politica) return false;
    if (!texto) return true;
    return [e.id_evento, e.name_user, e.name_oficina, e.name_tipo_evento, e.numero_documento, etiquetaTipo(e.tipo_anomalia)]
      .join(" ")
      .toLowerCase()
      .includes(texto);
  });
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "medium" });

export function formatearFecha(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? String(valor) : FORMATO_FECHA.format(fecha);
}

export const porcentaje = (valor, decimales = 2) =>
  valor == null || !Number.isFinite(Number(valor)) ? "—" : `${(Number(valor) * 100).toFixed(decimales)} %`;

export const score4 = (valor) => (valor == null ? "—" : Number(valor).toFixed(4));
