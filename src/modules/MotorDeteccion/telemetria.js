const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];
const NIVELES = ["critico", "alto", "medio", "bajo"];
const ESTADOS = ["abierto", "en_investigacion", "contenido", "mitigado", "falso_positivo"];
const TIPOS = [
  { id: "VISTA", sub: "Lectura / visualización auditable", color: "#64748b", peso_accion: 1, nivel: "bajo" },
  { id: "DESCARGAR", sub: "Descarga y tenencia de copia local", color: "#eab308", peso_accion: 2, nivel: "alto" },
  { id: "EDITAR", sub: "Modificación de documento", color: "#3b82f6", peso_accion: 2, nivel: "medio" },
  { id: "ELIMINAR", sub: "Destrucción / sabotaje de registro", color: "#ef4444", peso_accion: 3, nivel: "critico" },
  { id: "GUARDAR_COPIA", sub: "Duplicación de archivo / riesgo de fuga", color: "#f97316", peso_accion: 2.5, nivel: "alto" },
];
const numero = (valor) => Number(valor) || 0;
const contadores = (keys) => Object.fromEntries(keys.map((key) => [key, 0]));
const tiposVacios = () => TIPOS.map((tipo) => ({ ...tipo, nombre: tipo.id, cantidad: 0 }));

export function parseFechaEvento(fecha, ahora = new Date()) {
  const partes = String(fecha || "").trim().split(/[T ]/)[0].split(/[-/]/);
  let [year, mes, dia] = partes[0]?.length === 4 ? partes : [...partes].reverse();
  const fechaValida = new Date(Date.UTC(Number(year), Number(mes) - 1, Number(dia)));
  if (partes.length !== 3 || Number(year) < 1000 ||
      fechaValida.getUTCFullYear() !== Number(year) ||
      fechaValida.getUTCMonth() + 1 !== Number(mes) || fechaValida.getUTCDate() !== Number(dia)) {
    year = ahora.getFullYear();
    mes = ahora.getMonth() + 1;
    dia = ahora.getDate();
  }
  mes = String(mes).padStart(2, "0");
  dia = String(dia).padStart(2, "0");
  const nombre = MESES[Number(mes) - 1];
  return {
    mesNumero: mes,
    mesKey: `${year}-${mes}`,
    mesNombre: nombre,
    mesCompleto: `${nombre} ${year}`,
    diaKey: `${year}-${mes}-${dia}`,
    diaLabel: `${Number(dia)} ${nombre.toLowerCase()}`,
  };
}

export function normalizarTipoEvento(tipo, idTipo) {
  const raw = String(tipo || "").trim().toUpperCase();
  if (/COPIA|COPY/.test(raw)) return "GUARDAR_COPIA";
  if (/DESCARG|DOWN/.test(raw)) return "DESCARGAR";
  if (/EDIT/.test(raw)) return "EDITAR";
  if (/ELIMIN|DELET|BORR/.test(raw)) return "ELIMINAR";
  if (/VIST|READ|LECT/.test(raw)) return "VISTA";
  return TIPOS[Number(idTipo) - 1]?.id || "VISTA";
}

// Una amenaza es un evento anómalo, crítico/alto o con score >= UMBRAL_ALTO, o un evento cuyo par
// (documento, usuario) alcanza UMBRAL_ALTO al correlacionarlo en tiempo real con la trazabilidad.
// Es el mismo criterio para los contadores de los gráficos y para la tabla de incidentes.
export function esAmenazaEvento(evento, correlacion = null) {
  const nivel = String(evento.nivel_riesgo ?? evento.NIVEL_RIESGO ?? "").trim().toLowerCase();
  const anomalia = evento.es_anomalia === true || evento.es_anomalia === 1 || evento.es_anomalia === "true";
  return anomalia || nivel === "critico" || nivel === "alto" || numero(evento.score_final) >= UMBRAL_ALTO ||
    numero(correlacion?.score_correlacion) >= UMBRAL_ALTO;
}

// Correlación en vivo: un incidente por par (documento, usuario), igual que el motor del backend.
// Varios eventos del mismo par actualizan el mismo incidente en vez de sumar otro.
export function claveParIncidente(evento) {
  const doc = evento.id_documento ?? evento.ID_DOCUMENTO ?? "sin-doc";
  const usuario = evento.id_user ?? evento.user_id ?? evento.ID_USER ?? evento.name_user ?? "";
  return `${doc}-${usuario}`;
}

export function crearTelemetria() {
  return {
    total_eventos_analizados: 0, total_incidentes: 0,
    criticos: 0, anomalias: 0, score_total: 0,
    por_nivel_riesgo: contadores(NIVELES), por_clasificacion: {},
    tipos_eventos: tiposVacios(), tipos_eventos_por_mes: {},
    evolucion_mensual: [], evolucion_diaria: [],
    top_documentos: [], top_usuarios: [], incidentes_por_usuario: {},
    pares_incidente: {},
  };
}

function acumularPeriodo(periodos, periodo, nivel) {
  const anterior = periodos.find((item) => item.key === periodo.key);
  const actualizado = {
    ...contadores(NIVELES), ...periodo, ...anterior,
    [nivel]: numero(anterior?.[nivel]) + 1,
    total: numero(anterior?.total) + 1,
  };
  return [...periodos.filter((item) => item.key !== periodo.key), actualizado]
    .sort((a, b) => a.key.localeCompare(b.key));
}

function acumularTop(items, key, nuevo) {
  const anterior = items.find((item) => String(item[key]) === String(nuevo[key]));
  return [...items.filter((item) => String(item[key]) !== String(nuevo[key])), {
    ...anterior, ...nuevo,
    incidentes: numero(anterior?.incidentes) + numero(nuevo.incidentes),
    max_score: Math.max(numero(anterior?.max_score), numero(nuevo.max_score)),
  }];
}

// Los acumulados no dependen de las 300 filas que se conservan para la tabla.
export function acumularEvento(anterior, evento, ahora = new Date(), correlacion = null) {
  const tipo = normalizarTipoEvento(evento.name_tipo_evento ?? evento.NAME_TIPO_EVENTO ?? evento.tipo_evento,
    evento.id_tipo_evento ?? evento.ID_TIPO_EVENTO);
  const riesgo = String(evento.nivel_riesgo ?? evento.NIVEL_RIESGO ?? "bajo").trim().toLowerCase();
  const nivel = NIVELES.includes(riesgo) ? riesgo : "bajo";
  const anomalia = evento.es_anomalia === true || evento.es_anomalia === 1 || evento.es_anomalia === "true";
  const amenaza = esAmenazaEvento(evento, correlacion);
  // Un incidente = un par (documento, usuario). Solo el primer evento amenazante del par suma;
  // los siguientes del mismo par solo actualizan el score máximo.
  const par = claveParIncidente(evento);
  const parNuevo = amenaza && !anterior.pares_incidente?.[par];
  const fecha = parseFechaEvento(evento.fecha_evento ?? evento.FECHA_EVENTO ?? evento.fecha, ahora);
  const incrementarTipo = (items) => items.map((item) => ({ ...item,
    cantidad: numero(item.cantidad) + (item.id === tipo ? 1 : 0),
  }));
  const siguiente = {
    ...anterior,
    total_eventos_analizados: anterior.total_eventos_analizados + 1,
    total_incidentes: anterior.total_incidentes + Number(parNuevo),
    criticos: anterior.criticos + Number(nivel === "critico"),
    anomalias: anterior.anomalias + Number(anomalia),
    score_total: anterior.score_total + numero(evento.score_final),
    por_nivel_riesgo: { ...anterior.por_nivel_riesgo, [nivel]: anterior.por_nivel_riesgo[nivel] + 1 },
    tipos_eventos: incrementarTipo(anterior.tipos_eventos),
    tipos_eventos_por_mes: { ...anterior.tipos_eventos_por_mes,
      [fecha.mesNumero]: incrementarTipo(anterior.tipos_eventos_por_mes[fecha.mesNumero] || tiposVacios()),
    },
    evolucion_mensual: acumularPeriodo(anterior.evolucion_mensual,
      { key: fecha.mesKey, label: fecha.mesNombre, mes: fecha.mesNombre, mes_completo: fecha.mesCompleto }, nivel),
    evolucion_diaria: acumularPeriodo(anterior.evolucion_diaria,
      { key: fecha.diaKey, label: fecha.diaLabel, dia: fecha.diaLabel }, nivel),
  };
  siguiente.pares_incidente = parNuevo ? { ...anterior.pares_incidente, [par]: true }
    : (anterior.pares_incidente || {});
  if (amenaza) {
    const usuario = String(evento.id_user ?? evento.user_id ?? evento.name_user ?? "");
    const clasificacion = String(evento.name_clasificacion || "COMUN").trim().toUpperCase();
    const suma = Number(parNuevo);
    if (parNuevo) {
      siguiente.incidentes_por_usuario = { ...anterior.incidentes_por_usuario,
        [usuario]: numero(anterior.incidentes_por_usuario[usuario]) + 1,
      };
      siguiente.por_clasificacion = { ...anterior.por_clasificacion,
        [clasificacion]: numero(anterior.por_clasificacion[clasificacion]) + 1,
      };
    }
    if (evento.id_documento) siguiente.top_documentos = acumularTop(anterior.top_documentos, "id_documento", {
      id_documento: evento.id_documento, numero_documento: evento.numero_documento || `DOC-${evento.id_documento}`,
      clasificacion_doc: clasificacion, incidentes: suma, max_score: evento.score_final,
    });
    if (evento.id_user) siguiente.top_usuarios = acumularTop(anterior.top_usuarios, "id_user", {
      id_user: evento.id_user, nombre_usuario: evento.name_user || `Usuario ${evento.id_user}`,
      incidentes: suma, max_score: evento.score_final,
    });
  }
  return siguiente;
}

function sumarContadores(base = {}, vivo = {}) {
  return Object.fromEntries([...new Set([...Object.keys(base), ...Object.keys(vivo)])]
    .map((key) => [key, numero(base[key]) + numero(vivo[key])]));
}

function combinarTipos(base = [], vivo = []) {
  return tiposVacios().map((tipo) => {
    const historico = base.find((item) => (item.id || item.nombre) === tipo.id);
    const nuevo = vivo.find((item) => (item.id || item.nombre) === tipo.id);
    return { ...tipo, ...historico, cantidad: numero(historico?.cantidad) + numero(nuevo?.cantidad) };
  });
}

function combinarPeriodos(base = [], vivo = []) {
  const periodos = new Map(base.map((item) => [item.key, {
    ...item, ...Object.fromEntries([...NIVELES, "total"].map((key) => [key, numero(item[key])])),
  }]));
  vivo.forEach((item) => {
    const historico = periodos.get(item.key);
    periodos.set(item.key, { ...item, ...Object.fromEntries([...NIVELES, "total"]
      .map((key) => [key, numero(historico?.[key]) + numero(item[key])])) });
  });
  return [...periodos.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function combinarTop(base = [], vivo = [], key) {
  return vivo.reduce((items, item) => acumularTop(items, key, item), base.map((item) => ({ ...item })))
    .sort((a, b) => numero(b.max_score) - numero(a.max_score) || numero(b.incidentes) - numero(a.incidentes))
    .slice(0, 10);
}

export function combinarResumenSOC(base = {}, vivo, neutralizados = []) {
  const ids = new Set(neutralizados.map(String));
  const contenidos = Object.entries(vivo.incidentes_por_usuario)
    .reduce((total, [id, cantidad]) => total + (ids.has(id) ? cantidad : 0), 0);
  const porEstado = sumarContadores(base.por_estado, {
    ...contadores(ESTADOS), abierto: vivo.total_incidentes - contenidos, contenido: contenidos,
  });
  const totalIncidentes = numero(base.total_incidentes) + vivo.total_incidentes;
  const tipos = combinarTipos(base.tipos_eventos, vivo.tipos_eventos);
  const tiposPorMes = { todos: tipos };
  for (let mes = 1; mes <= 12; mes += 1) {
    const key = String(mes).padStart(2, "0");
    tiposPorMes[key] = combinarTipos(base.tipos_eventos_por_mes?.[key], vivo.tipos_eventos_por_mes[key]);
  }
  const riesgos = sumarContadores(base.por_nivel_riesgo || base.por_riesgo, vivo.por_nivel_riesgo);
  return {
    ...base,
    total_eventos_analizados: numero(base.total_eventos_analizados) + vivo.total_eventos_analizados,
    total_incidentes: totalIncidentes, por_nivel_riesgo: riesgos, por_riesgo: riesgos,
    por_estado: porEstado,
    tasa_contencion_porcentaje: totalIncidentes
      ? Number(((porEstado.contenido + porEstado.mitigado) / totalIncidentes * 100).toFixed(1)) : 0,
    tipos_eventos: tipos, tipos_eventos_por_mes: tiposPorMes,
    evolucion_mensual: combinarPeriodos(base.evolucion_mensual, vivo.evolucion_mensual),
    evolucion_diaria: combinarPeriodos(base.evolucion_diaria, vivo.evolucion_diaria),
    por_clasificacion: sumarContadores(base.por_clasificacion, vivo.por_clasificacion),
    top_documentos: combinarTop(base.top_documentos, vivo.top_documentos, "id_documento"),
    top_usuarios: combinarTop(base.top_usuarios, vivo.top_usuarios, "id_user"),
  };
}

export const UMBRAL_CRITICO = 0.75;
export const UMBRAL_ALTO = 0.50;
export const UMBRAL_MEDIO = 0.25;

/**
 * Evalúa el estado forense de contención y bloqueo de cuenta según constantes.py:
 * - Cualquier evento con riesgo 'critico' o score >= 0.75 (UMBRAL_CRITICO) debe ser contenido
 *   preventivamente en tiempo real (estado: 'contenido') y su cuenta bloqueada (cuenta_bloqueada: true).
 * - Usuarios en neutralizadosIds también son considerados contenidos con cuenta bloqueada.
 */
export function evaluarEstadoForense(inc, neutralizadosIds = []) {
  if (!inc) return { esCritico: false, esBloqueado: false, estadoEfectivo: "abierto" };

  const userId = String(inc.id_user ?? inc.ID_USER ?? inc.user_id ?? "");
  const userName = String(inc.nombre_usuario || inc.name_user || inc.nombre || "").trim();
  const scoreVal = Number(inc.score_correlacion ?? inc.score_final ?? 0);
  const scoreEscala = Number(inc.score_riesgo ?? 0);
  const riesgoStr = String(inc.nivel_riesgo || "").trim().toLowerCase();

  const neutralizadosSet = new Set(
    (Array.isArray(neutralizadosIds) ? neutralizadosIds : []).map(String)
  );

  const esPorId = Boolean(userId && neutralizadosSet.has(userId));
  const esPorNombre = Boolean(userName && neutralizadosSet.has(userName));

  // Criterio institucional según constantes.py: UMBRAL_CRITICO = 0.75 (o 22.5 en escala 0-30)
  const esCritico = riesgoStr === "critico" || scoreVal >= UMBRAL_CRITICO || scoreEscala >= 22.5;

  const esBloqueado = Boolean(
    inc.cuenta_bloqueada === true ||
    esCritico ||
    esPorId ||
    esPorNombre
  );

  // En Motor de Detección, eventos críticos deben estar contenidos preventivamente en tiempo real
  const estadoEfectivo = (esCritico || esBloqueado)
    ? "contenido"
    : String(inc.estado || "abierto").trim().toLowerCase();

  return {
    esCritico,
    esBloqueado,
    estadoEfectivo,
  };
}

const MAX_INCIDENTES_EN_VIVO = 100;

/**
 * Correlación en tiempo real. El cálculo lo hace el backend con cada evento
 * (0.45·score_trazabilidad + 0.55·score_eventos; si falta uno de los dos se usa el del
 * dominio disponible) y llega en `correlacion` junto al evento: aquí no se estima ni se
 * recalcula ningún score. Se mantiene UN incidente por par (documento, usuario) y, como el
 * backend ya acumula todos los eventos del par, cada mensaje reemplaza al anterior.
 * `mapa` es { [clave]: incidente }; devuelve un mapa nuevo (inmutable) o el mismo si el
 * evento no califica como incidente o el backend no pudo correlacionarlo.
 */
export function correlacionarEnVivo(mapa, evento, correlacion, secuencia = Date.now()) {
  if (!correlacion || !esAmenazaEvento(evento, correlacion)) return mapa;
  const clave = claveParIncidente(evento);
  const incidente = { ...correlacion, id: `LIVE-${clave}`, es_en_vivo: true, actualizado_en: secuencia };
  // La contención se deriva con la misma política que aplica la tabla de incidentes.
  const forense = evaluarEstadoForense(incidente);
  incidente.estado = forense.estadoEfectivo;
  incidente.cuenta_bloqueada = forense.esBloqueado;
  incidente.es_critico_auto = forense.esCritico;
  const siguiente = { ...mapa, [clave]: incidente };
  const claves = Object.keys(siguiente);
  if (claves.length > MAX_INCIDENTES_EN_VIVO) {
    const masAntigua = claves.reduce((a, b) => (siguiente[a].actualizado_en <= siguiente[b].actualizado_en ? a : b));
    delete siguiente[masAntigua];
  }
  return siguiente;
}

export const listarIncidentesEnVivo = (mapa) =>
  Object.values(mapa).sort((a, b) => numero(b.actualizado_en) - numero(a.actualizado_en));
