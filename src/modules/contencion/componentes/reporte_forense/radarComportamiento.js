const ACCIONES_IMPACTO = ["DESCARGAR", "EDITAR", "ELIMINAR", "GUARDAR_COPIA"];

function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function proporcion(parte, total) {
  const n = numero(parte);
  const d = numero(total);
  return n !== null && d > 0 && n <= d ? Math.round((n / d) * 1000) / 10 : null;
}

function puntaje(valor) {
  const n = numero(valor);
  return n !== null && n <= 1 ? Math.round(n * 1000) / 10 : null;
}

/** Deriva el gráfico únicamente del reporte sellado, sin alterar su contenido. */
export function datosRadarComportamiento(reporte) {
  const actividad = reporte?.actividad_reciente ?? {};
  const modelos = reporte?.evaluacion_modelos ?? {};
  const referencia = reporte?.metadata?.tipo_reporte === "consulta" ? "evento analizado" : "evento que originó el bloqueo";
  const clasificaciones = actividad.por_clasificacion;
  let impacto = actividad.acciones_alto_impacto;
  if (impacto == null && actividad.por_accion) {
    const valores = ACCIONES_IMPACTO.map((accion) => numero(actividad.por_accion[accion] ?? 0));
    impacto = valores.every((n) => n !== null) ? valores.reduce((suma, n) => suma + n, 0) : null;
  }
  return [
    { id: "horario", etiqueta: "Fuera de horario", lineas: ["Fuera de", "horario"],
      valor: proporcion(actividad.fuera_de_horario, actividad.total_eventos), unidad: "%",
      descripcion: "Proporción de eventos registrados fuera de la jornada institucional." },
    { id: "clasificacion", etiqueta: "Documentos SECRETO", lineas: ["Documentos", "SECRETO"],
      valor: proporcion(clasificaciones ? clasificaciones.SECRETO ?? 0 : null, actividad.total_eventos), unidad: "%",
      descripcion: "Proporción de eventos registrados sobre documentos SECRETO." },
    { id: "impacto", etiqueta: "Acciones de alto impacto", lineas: ["Acciones de", "alto impacto"],
      valor: proporcion(impacto, actividad.total_eventos), unidad: "%",
      descripcion: "Descargas, ediciones, eliminaciones y copias en la actividad registrada." },
    { id: "isolation_forest", etiqueta: "Isolation Forest", lineas: ["Isolation", "Forest"],
      valor: puntaje(modelos.isolation_forest?.score), unidad: "/ 100",
      descripcion: `Puntuación del ${referencia} como evento aislado.` },
    { id: "lstm_autoencoder", etiqueta: "LSTM Autoencoder", lineas: ["LSTM", "Autoencoder"],
      valor: puntaje(modelos.lstm_autoencoder?.score), unidad: "/ 100",
      descripcion: `Puntuación de la secuencia del ${referencia}.` },
    { id: "ensemble", etiqueta: "Riesgo final", lineas: ["Riesgo", "final"],
      valor: puntaje(modelos.score_final), unidad: "/ 100",
      descripcion: `Resultado combinado conservado para el ${referencia}.` },
  ];
}
