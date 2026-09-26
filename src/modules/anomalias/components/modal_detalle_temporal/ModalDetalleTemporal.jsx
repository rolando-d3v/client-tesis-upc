import { useState, useMemo, useEffect, useCallback } from "react";
import { useDetalleAnomalias, useRarezaEstadistica } from "../../../../api/apiAnomalias";
import styles from "./ModalDetalleTemporal.module.css";

// Formateador completo de fecha y hora
const formatDateTime = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return { fecha: "-", hora: "-" };
  try {
    const clean = dateStr.replace("T", " ");
    const [datePart, timePart] = clean.split(" ");
    let formattedDate = datePart;
    if (datePart && datePart.includes("-")) {
      const parts = datePart.split("-");
      if (parts.length === 3) {
        const [y, m, d] = parts;
        if (y.length === 4) formattedDate = `${d}/${m}/${y}`;
      }
    }
    const formattedTime = timePart ? timePart.split(".")[0] : "--:--";
    return { fecha: formattedDate, hora: formattedTime };
  } catch {
    return { fecha: String(dateStr), hora: "" };
  }
};

// Badges de clasificación de seguridad
function getBadgeClass(clasificacion) {
  const c = clasificacion?.toLowerCase() || "";
  if (c.includes("secreto")) return `${styles.badge} ${styles.badgeSecreto}`;
  if (c.includes("reservado")) return `${styles.badge} ${styles.badgeReservado}`;
  if (c.includes("confidencial")) return `${styles.badge} ${styles.badgeConfidencial}`;
  return `${styles.badge} ${styles.badgeComun}`;
}

// Estilo de celda de score
function getScoreClass(score) {
  const num = Number(score);
  if (isNaN(num)) return styles.scoreLow;
  if (num >= 0.85) return styles.scoreCritical;
  if (num >= 0.7) return styles.scoreWarning;
  return styles.scoreLow;
}

// Inferencia de motivos en cliente como fallback robusto
function inferirMotivos(item) {
  if (Array.isArray(item.motivos) && item.motivos.length > 0) {
    return item.motivos;
  }
  const motivos = [];
  const fc = item.fecha_creacion;
  if (fc) {
    try {
      const dt = new Date(fc);
      const h = dt.getHours();
      const dow = dt.getDay(); // 0=Dom, 6=Sáb
      if (h < 8 || h >= 16) {
        if (h < 6 || h >= 22) {
          motivos.push("🌙 Operación en madrugada / noche profunda");
        } else {
          motivos.push("⏰ Operación fuera de horario laboral (08:00–16:00)");
        }
      }
      if (dow === 0 || dow === 6) {
        motivos.push("🗓️ Actividad en fin de semana (no laborable)");
      }
    } catch {
      // Ignorar error de parsing
    }
  }

  const clasif = (item.clasificacion || "").toUpperCase();
  if (clasif.includes("SECRETO")) {
    motivos.push("🔴 Documento de máxima reserva (SECRETO)");
  } else if (clasif.includes("RESERVADO")) {
    motivos.push("🟠 Documento con nivel RESERVADO");
  }

  const destino = (item.destino || "").toLowerCase();
  if (destino.includes("exterior")) {
    motivos.push("🌐 Despacho / Transferencia externa");
  }

  const peso = item.peso_mb;
  if (peso && Number(peso) > 15.0) {
    motivos.push(`📦 Archivo voluminoso inusual (${Number(peso).toFixed(1)} MB)`);
  }

  const score = item.score;
  if (score != null) {
    const s = Number(score);
    if (s >= 0.85) {
      motivos.push(`⚡ Desviación extrema Isolation Forest (${s.toFixed(4)})`);
    } else if (s >= 0.7) {
      motivos.push(`⚠️ Alto score de anomalía multivariada (${s.toFixed(4)})`);
    }
  }

  if (motivos.length === 0) {
    motivos.push("🔍 Patrón atípico multivariable detectado por el modelo");
  }

  return motivos;
}

// Matriz comparativa de evaluación: Valor Registrado vs. Rango Normal
function calcularMatrizEvaluacion(row) {
  if (!row) return [];
  const matriz = [];

  // 1. Horario de Operación
  let hora = null;
  let esFueraHorario = false;
  let esMadrugada = false;
  let diaSemanaNum = null;
  let diaSemanaNombre = "-";

  if (row.fecha_creacion) {
    try {
      const isoStr = String(row.fecha_creacion).includes("T")
        ? row.fecha_creacion
        : String(row.fecha_creacion).replace(" ", "T");
      const dt = new Date(isoStr);
      if (!isNaN(dt.getTime())) {
        hora = dt.getHours();
        diaSemanaNum = dt.getDay(); // 0=Dom, 6=Sáb
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        diaSemanaNombre = dias[diaSemanaNum] || "-";
        esFueraHorario = hora < 8 || hora >= 16;
        esMadrugada = hora < 6 || hora >= 22;
      }
    } catch {}
  }

  const horaTexto = row.fecha_creacion ? formatDateTime(row.fecha_creacion).hora : "--:--";
  matriz.push({
    id: "horario",
    icon: "⏰",
    parametro: "Horario de Operación",
    valorObservado: `${horaTexto} hrs ${
      esMadrugada
        ? "— Madrugada / Noche"
        : esFueraHorario
        ? "— Fuera de Jornada"
        : "— Horario Laboral"
    }`,
    rangoNormal: "08:00 – 16:00 hrs (Jornada institucional ordinaria)",
    esAnomalo: esFueraHorario,
    nivel: esMadrugada ? "critico" : esFueraHorario ? "alerta" : "normal",
    impacto: esMadrugada
      ? "Operación realizada en madrugada/noche profunda (00:00–06:00 o 22:00–24:00), catalogada como riesgo crítico."
      : esFueraHorario
      ? "Registro emitido fuera del horario de atención de dependencias (08:00–16:00)."
      : "Operación realizada dentro del horario laboral estándar regular.",
  });

  // 2. Día de la Semana
  const esFinDeSemana = diaSemanaNum === 0 || diaSemanaNum === 6;
  matriz.push({
    id: "dia_semana",
    icon: "🗓️",
    parametro: "Día de la Semana",
    valorObservado: `${diaSemanaNombre} ${esFinDeSemana ? "(No laborable / Fin de semana)" : "(Día hábil ordinario)"}`,
    rangoNormal: "Lunes a Viernes (Días hábiles institucionales)",
    esAnomalo: esFinDeSemana,
    nivel: esFinDeSemana ? "critico" : "normal",
    impacto: esFinDeSemana
      ? "Movimiento procesado en sábado o domingo sin justificación de guardia programada."
      : "Trámite registrado en día hábil ordinario de trabajo.",
  });

  // 3. Peso del Archivo Adjunto
  const peso = row.peso_mb != null ? Number(row.peso_mb) : 0;
  const esPesoExcesivo = peso > 15.0;
  matriz.push({
    id: "peso",
    icon: "📦",
    parametro: "Peso del Archivo Adjunto",
    valorObservado: row.peso_mb != null ? `${peso.toFixed(2)} MB` : "No registrado",
    rangoNormal: "≤ 15.00 MB (Promedio estándar documental: 1.0 – 5.0 MB)",
    esAnomalo: esPesoExcesivo,
    nivel: esPesoExcesivo ? "alerta" : "normal",
    impacto: esPesoExcesivo
      ? `Supera el umbral institucional de 15 MB (${peso.toFixed(2)} MB). Riesgo de exfiltración o archivo sobredimensionado.`
      : "Tamaño de archivo regular y dentro de los parámetros de transmisión estándar.",
  });

  // 4. Clasificación de Seguridad
  const clasif = (row.clasificacion || "COMÚN").toUpperCase();
  const esSecreto = clasif.includes("SECRETO");
  const esReservado = clasif.includes("RESERVADO");
  const esClasifAnomala = esSecreto || esReservado;
  matriz.push({
    id: "clasificacion",
    icon: "🔒",
    parametro: "Clasificación de Seguridad",
    valorObservado: clasif,
    rangoNormal: "COMÚN / PÚBLICO (Documentación de circulación regular)",
    esAnomalo: esClasifAnomala,
    nivel: esSecreto ? "critico" : esReservado ? "alerta" : "normal",
    impacto: esSecreto
      ? "Nivel máximo de reserva estatal (SECRETO). Movimiento sensible sujeto a fiscalización rigurosa."
      : esReservado
      ? "Documento con restricción de acceso (RESERVADO). Mayor sensibilidad de datos."
      : "Documento de carácter común y circulación estándar institucional.",
  });

  // 5. Destino de la Transferencia
  const destino = (row.destino || "INTERNA").toUpperCase();
  const esExterior = destino.includes("EXTERIOR");
  matriz.push({
    id: "destino",
    icon: "🌐",
    parametro: "Destino de Transferencia",
    valorObservado: `${destino} ${esExterior ? "(Entidad Externa)" : "(Sede Interna)"}`,
    rangoNormal: "INTERNA (Flujo entre oficinas de la misma entidad)",
    esAnomalo: esExterior,
    nivel: esExterior ? "alerta" : "normal",
    impacto: esExterior
      ? "Despacho dirigido hacia el exterior de la institución, incrementa riesgo de fuga de información."
      : "Flujo documental regular entre dependencias internas de la institución.",
  });

  // 6. Score Isolation Forest
  const score = Number(row.score) || 0;
  const esScoreCritico = score >= 0.85;
  const esScoreAlto = score >= 0.70;
  matriz.push({
    id: "score",
    icon: "⚡",
    parametro: "Score Isolation Forest (Algoritmo IA)",
    valorObservado: `${score.toFixed(6)} — ${
      esScoreCritico ? "Desviación Crítica" : esScoreAlto ? "Alto Riesgo" : "Patrón Atípico"
    }`,
    rangoNormal: "< 0.7000 (Comportamiento habitual / Inlier)",
    esAnomalo: esScoreAlto,
    nivel: esScoreCritico ? "critico" : esScoreAlto ? "alerta" : "normal",
    impacto: esScoreCritico
      ? "El ensamble de 300 árboles aisladores determinó una distancia de anomalía extrema respecto al centroide normal."
      : esScoreAlto
      ? "Combinación multivariable inusual detectada por el modelo predictivo (score ≥ 0.7000)."
      : "Anomalía detectada por combinación de otras variables; el score individual no supera el umbral alto.",
  });

  return matriz;
}

// Exportador a CSV
function exportToCSV(items, filename = "detalle_anomalias.csv") {
  if (!items || !items.length) return;
  const headers = [
    "ID Registro",
    "Nro Documento",
    "ID Documento",
    "Tipo Documento",
    "Fecha Creacion",
    "Usuario",
    "Oficina Origen",
    "Oficina Destino",
    "Destino",
    "Clasificacion",
    "Prioridad",
    "Estado",
    "Peso MB",
    "Score IF",
    "Motivos de Anomalia",
  ];
  const rows = items.map((item) => [
    item.id_registro ?? "",
    `"${item.numero_doc ?? ""}"`,
    item.id_documento ?? "",
    `"${item.tipo_documento ?? ""}"`,
    `"${item.fecha_creacion ?? ""}"`,
    `"${item.usuario ?? ""}"`,
    `"${item.oficina_origen ?? ""}"`,
    `"${item.oficina_destino ?? ""}"`,
    `"${item.destino ?? ""}"`,
    `"${item.clasificacion ?? ""}"`,
    `"${item.prioridad ?? ""}"`,
    `"${item.estado ?? ""}"`,
    item.peso_mb ?? "",
    item.score ?? "",
    `"${(item.motivosCalculados || []).join(" | ")}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================
// COMPONENTE: DESGLOSE DE RAREZA ESTADÍSTICA (XAI ISOLATION FOREST)
// ============================================================
function SeccionRarezaEstadistica({ row }) {
  const { data: rareza, isLoading } = useRarezaEstadistica(row?.id_registro);

  if (isLoading) {
    return (
      <div className={styles.xaiLoadingContainer}>
        <div className={styles.xaiSpinner} />
        <span>Calculando frecuencias estadísticas en el dataset (10,000 registros)...</span>
      </div>
    );
  }

  const factores = rareza?.factores || [];
  const totalDataset = rareza?.total_dataset ? rareza.total_dataset.toLocaleString() : "10,000";
  const factorDeterminante =
    rareza?.factor_determinante ||
    "Comportamiento multivariado complejo analizado por el ensamble de 300 árboles de Isolation Forest.";

  if (!factores.length) return null;

  return (
    <div className={styles.xaiSection}>
      <div className={styles.xaiHeader}>
        <div className={styles.xaiHeaderLeft}>
          <span className={styles.xaiHeaderIcon}>📊</span>
          <div>
            <h4 className={styles.xaiTitle}>
              Desglose de Frecuencia y Rareza Estadística (Explicabilidad XAI - Isolation Forest)
            </h4>
            <p className={styles.xaiSubtitle}>
              Contraste de las variables del expediente frente a la distribución real del dataset histórico ({totalDataset} registros)
            </p>
          </div>
        </div>
        <span className={styles.xaiBadgeModel}>Modelo: 300 Árboles IF</span>
      </div>

      {/* Banner de factor determinante */}
      <div className={styles.xaiInsightBanner}>
        <span className={styles.xaiInsightIcon}>💡</span>
        <div className={styles.xaiInsightText}>
          <strong>Diagnóstico Principal del Algoritmo: </strong>
          <span>{factorDeterminante}</span>
        </div>
      </div>

      {/* Tabla de Factores y Rareza */}
      <div className={styles.xaiTableWrapper}>
        <table className={styles.xaiTable}>
          <thead>
            <tr>
              <th style={{ width: "24%" }}>Variable Analizada</th>
              <th style={{ width: "28%" }}>Valor en este Expediente</th>
              <th style={{ width: "16%" }}>Ocurrencia Histórica</th>
              <th style={{ width: "16%" }}>Frecuencia / Densidad</th>
              <th style={{ width: "16%" }}>Nivel de Rareza</th>
            </tr>
          </thead>
          <tbody>
            {factores.map((f, i) => {
              const isCritico = f.nivel === "CRITICO";
              const isAlto = f.nivel === "ALTO";
              const isModerado = f.nivel === "MODERADO";

              return (
                <tr key={i} className={isCritico ? styles.xaiRowCritico : ""}>
                  <td className={styles.xaiVarCell}>
                    <span className={styles.xaiVarIcon}>{f.icon || "📌"}</span>
                    <strong>{f.variable}</strong>
                  </td>
                  <td className={styles.xaiValCell}>
                    <code className={styles.xaiCodeVal}>{f.valor}</code>
                  </td>
                  <td className={styles.xaiCountCell}>
                    <strong>{f.frecuencia}</strong>
                    <span className={styles.xaiTotalMuted}> de {totalDataset}</span>
                  </td>
                  <td className={styles.xaiPctCell}>
                    <div className={styles.xaiProgressWrap}>
                      <span className={styles.xaiPctText}>{f.porcentaje.toFixed(3)}%</span>
                      <div className={styles.xaiProgressBar}>
                        <div
                          className={`${styles.xaiProgressFill} ${
                            isCritico
                              ? styles.fillCritico
                              : isAlto
                              ? styles.fillAlto
                              : isModerado
                              ? styles.fillModerado
                              : styles.fillNormal
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, f.porcentaje * 5))}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={styles.xaiRarezaCell}>
                    <span
                      className={`${styles.xaiRarezaPill} ${
                        isCritico
                          ? styles.pillCritico
                          : isAlto
                          ? styles.pillAlto
                          : isModerado
                          ? styles.pillModerado
                          : styles.pillNormal
                      }`}
                    >
                      {f.etiqueta_rareza}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.xaiFooterNote}>
        <span>📌</span>
        <span>
          <strong>Fundamento Metodológico:</strong> En Isolation Forest, las características con frecuencias extremadamente bajas (≤ 0.05%) son particionadas en ramas superficiales con caminos de búsqueda cortos $E(h(x))$, lo que eleva el score hacia el umbral de anomalía crítica (≥ 0.8500).
        </span>
      </div>
    </div>
  );
}

export default function ModalDetalleTemporal({
  punto = null,
  filtrosGlobales = {},
  onClose,
  onSelectDoc,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMotivo, setFilterMotivo] = useState("all");
  const [isMaximized, setIsMaximized] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sortConfig, setSortConfig] = useState({ key: "score", direction: "desc" });
  const [selectedFichaRow, setSelectedFichaRow] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Cerrar con Escape: si la ficha modal está abierta, se cierra ella primero
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (selectedFichaRow) {
          setSelectedFichaRow(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFichaRow, onClose]);

  // Bloquear scroll de fondo
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Construir filtros de consulta para el endpoint
  const queryFiltros = useMemo(() => {
    if (!punto) return {};
    const f = {
      fechaInicio: filtrosGlobales?.fechaInicio,
      fechaFin: filtrosGlobales?.fechaFin,
    };
    if (punto.tipo === "hora") {
      f.hora = punto.hora_num;
    } else if (punto.tipo === "dia") {
      f.fecha = punto.fecha;
    } else if (punto.tipo === "heatmap") {
      f.hora = punto.hora_num;
      f.dia_semana = punto.dia_num;
    }
    return f;
  }, [punto, filtrosGlobales]);

  // Consulta al backend
  const { data: result, isLoading, isError, error } = useDetalleAnomalias(1, 1000, queryFiltros);
  const rawAnomalias = result?.data || [];

  // Enriquecer registros con motivos calculados
  const anomalias = useMemo(() => {
    return rawAnomalias.map((item) => ({
      ...item,
      motivosCalculados: inferirMotivos(item),
    }));
  }, [rawAnomalias]);

  // Matriz de evaluación del documento seleccionado en el modal ficha
  const matrizEvaluacion = useMemo(() => {
    return selectedFichaRow ? calcularMatrizEvaluacion(selectedFichaRow) : [];
  }, [selectedFichaRow]);

  // Filtrado en memoria
  const filteredAnomalias = useMemo(() => {
    let list = anomalias;

    if (filterMotivo === "fuera_horario") {
      list = list.filter((a) =>
        a.motivosCalculados.some((m) => m.includes("horario") || m.includes("jornada") || m.includes("madrugada") || m.includes("fin de semana"))
      );
    } else if (filterMotivo === "secreto") {
      list = list.filter((a) =>
        a.motivosCalculados.some((m) => m.includes("SECRETO") || m.includes("RESERVADO"))
      );
    } else if (filterMotivo === "exterior") {
      list = list.filter((a) =>
        a.motivosCalculados.some((m) => m.includes("externa") || m.includes("exterior"))
      );
    } else if (filterMotivo === "critico") {
      list = list.filter((a) => Number(a.score) >= 0.85);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((a) => {
        return (
          String(a.id_registro).includes(q) ||
          String(a.numero_doc || "").toLowerCase().includes(q) ||
          String(a.usuario || "").toLowerCase().includes(q) ||
          String(a.oficina_origen || "").toLowerCase().includes(q) ||
          String(a.oficina_destino || "").toLowerCase().includes(q) ||
          String(a.clasificacion || "").toLowerCase().includes(q) ||
          String(a.tipo_documento || "").toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [anomalias, searchTerm, filterMotivo]);

  // Ordenamiento
  const sortedAnomalias = useMemo(() => {
    if (!sortConfig.key) return filteredAnomalias;
    const sorted = [...filteredAnomalias];
    return sorted.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (valA == null) valA = "";
      if (valB == null) valB = "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
      return sortConfig.direction === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredAnomalias, sortConfig]);

  // Paginación
  const totalPages = Math.ceil(sortedAnomalias.length / pageSize) || 1;
  const paginatedAnomalias = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedAnomalias.slice(start, start + pageSize);
  }, [sortedAnomalias, page, pageSize]);

  // Métricas rápidas para KPIs
  const kpiStats = useMemo(() => {
    const total = anomalias.length;
    if (total === 0) return { total: 0, fueraHorario: 0, secreto: 0, exterior: 0, avgScore: 0 };
    const fueraHorario = anomalias.filter((a) =>
      a.motivosCalculados.some((m) => m.includes("horario") || m.includes("jornada") || m.includes("madrugada") || m.includes("fin de semana"))
    ).length;
    const secreto = anomalias.filter((a) =>
      (a.clasificacion || "").toUpperCase().includes("SECRETO")
    ).length;
    const exterior = anomalias.filter((a) =>
      a.motivosCalculados.some((m) => m.includes("externa") || m.includes("exterior"))
    ).length;
    const avgScore =
      anomalias.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) / total;
    return {
      total,
      fueraHorario,
      secreto,
      exterior,
      avgScore: avgScore.toFixed(4),
    };
  }, [anomalias]);

  // Título e información de contexto
  const headerContext = useMemo(() => {
    if (!punto) return { icon: "📊", title: "Detalle de Anomalías", subtitle: "" };
    if (punto.tipo === "hora") {
      const horaText = String(punto.valor).includes(":") ? punto.valor : `${punto.valor}:00`;
      const esFuera = punto.fuera_horario;
      return {
        icon: "⏰",
        title: `Anomalías Registradas a las ${horaText} hrs`,
        subtitle: `Registros concentrados en la franja horaria de las ${horaText}.`,
        tag: esFuera ? "🌙 Fuera de jornada (08:00 - 16:00)" : "☀️ Horario laboral",
        tagClass: esFuera ? styles.tagAlert : styles.tagSafe,
      };
    }
    if (punto.tipo === "dia") {
      const { fecha } = formatDateTime(punto.valor);
      return {
        icon: "📅",
        title: `Anomalías Registradas el Día ${fecha}`,
        subtitle: `Comportamiento temporal de expedientes para la fecha ${fecha}.`,
        tag: `Fecha: ${fecha}`,
        tagClass: styles.tagNeutral,
      };
    }
    if (punto.tipo === "heatmap") {
      const horaText = punto.hora || `${String(punto.hora_num).padStart(2, "0")}:00`;
      const esFuera = punto.hora_num < 8 || punto.hora_num >= 16;
      return {
        icon: "🗓️",
        title: `Anomalías: ${punto.diaFull} a las ${horaText} hrs`,
        subtitle: `Intersección en mapa de calor: ${punto.diaFull}, ${horaText}.`,
        tag: esFuera ? "🌙 Madrugada / Fuera de jornada" : "☀️ Jornada laboral",
        tagClass: esFuera ? styles.tagAlert : styles.tagSafe,
      };
    }
    return { icon: "📊", title: "Detalle de Anomalías", subtitle: "" };
  }, [punto]);

  // Toggle ordenamiento
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  // Copiar N° Documento
  const handleCopyDoc = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!punto) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${isMaximized ? styles.modalMaximized : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= CABECERA DEL MODAL ================= */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>{headerContext.icon}</div>
            <div className={styles.headerTitles}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{headerContext.title}</h2>
                {headerContext.tag && (
                  <span className={`${styles.contextTag} ${headerContext.tagClass}`}>
                    {headerContext.tag}
                  </span>
                )}
                <span className={styles.countPill}>
                  {anomalias.length} {anomalias.length === 1 ? "anomalía" : "anomalías"}
                </span>
              </div>
              <p className={styles.subtitle}>{headerContext.subtitle}</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerExportBtn}
              onClick={() => exportToCSV(sortedAnomalias, `anomalias_${punto.tipo}_${punto.valor || "datos"}.csv`)}
              title="Descargar datos en CSV"
              disabled={!sortedAnomalias.length}
            >
              <span>📥</span>
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => setIsMaximized((prev) => !prev)}
              title={isMaximized ? "Restaurar tamaño normal" : "Maximizar ventana"}
            >
              {isMaximized ? "🗗" : "⛶"}
            </button>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={onClose}
              title="Cerrar modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= BARRA SUPERIOR DE KPIS ================= */}
        <div className={styles.kpiBar}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Identificadas</span>
            <span className={styles.kpiValue} style={{ color: "#ef4444" }}>
              {kpiStats.total}
            </span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>🌙 Fuera de Jornada</span>
            <span className={styles.kpiValue} style={{ color: "#f97316" }}>
              {kpiStats.fueraHorario}{" "}
              <small className={styles.kpiPercent}>
                ({kpiStats.total > 0 ? Math.round((kpiStats.fueraHorario / kpiStats.total) * 100) : 0}%)
              </small>
            </span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>🔴 Docs Secretos</span>
            <span className={styles.kpiValue} style={{ color: "#dc2626" }}>
              {kpiStats.secreto}
            </span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>🌐 Despachos Externos</span>
            <span className={styles.kpiValue} style={{ color: "#0284c7" }}>
              {kpiStats.exterior}
            </span>
          </div>

          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>⚡ Score IF Promedio</span>
            <span className={styles.kpiValue} style={{ color: "#6366f1" }}>
              {kpiStats.avgScore}
            </span>
          </div>
        </div>

        {/* ================= BARRA DE CONTROLES: BÚSQUEDA Y FILTROS ================= */}
        <div className={styles.controlsBar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por usuario, oficina, documento, tipo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchTerm("")}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.filterChips}>
            <button
              type="button"
              className={`${styles.filterChip} ${filterMotivo === "all" ? styles.filterChipActive : ""}`}
              onClick={() => {
                setFilterMotivo("all");
                setPage(1);
              }}
            >
              Todos ({anomalias.length})
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filterMotivo === "fuera_horario" ? styles.filterChipActive : ""}`}
              onClick={() => {
                setFilterMotivo("fuera_horario");
                setPage(1);
              }}
            >
              🌙 Fuera de Horario
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filterMotivo === "secreto" ? styles.filterChipActive : ""}`}
              onClick={() => {
                setFilterMotivo("secreto");
                setPage(1);
              }}
            >
              🔴 Secretos / Reservados
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filterMotivo === "exterior" ? styles.filterChipActive : ""}`}
              onClick={() => {
                setFilterMotivo("exterior");
                setPage(1);
              }}
            >
              🌐 Despachos Exteriores
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filterMotivo === "critico" ? styles.filterChipActive : ""}`}
              onClick={() => {
                setFilterMotivo("critico");
                setPage(1);
              }}
            >
              ⚡ Score Crítico (≥ 0.85)
            </button>
          </div>

          <div className={styles.pageSizeWrap}>
            <span className={styles.pageSizeLabel}>Filas:</span>
            <select
              className={styles.pageSizeSelect}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* ================= CONTENIDO: TABLA DETALLADA ================= */}
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Consultando registros anómalos del punto temporal...</p>
            </div>
          ) : isError ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>⚠️</span>
              <p>Error al cargar el detalle: {error?.message || "Ocurrió un fallo en el servidor"}</p>
            </div>
          ) : sortedAnomalias.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <p>No se encontraron registros que coincidan con los filtros aplicados.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "115px", textAlign: "center" }} title="Abrir ficha técnica en modal">
                    Ficha Técnica
                  </th>
                  <th
                    style={{ width: "85px", cursor: "pointer" }}
                    onClick={() => handleSort("id_registro")}
                    title="Ordenar por ID"
                  >
                    ID {sortConfig.key === "id_registro" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th
                    style={{ width: "170px", cursor: "pointer" }}
                    onClick={() => handleSort("numero_doc")}
                    title="Ordenar por Documento"
                  >
                    Documento {sortConfig.key === "numero_doc" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th style={{ width: "115px", textAlign: "center" }}>Trazabilidad</th>
                  <th
                    style={{ width: "140px", cursor: "pointer" }}
                    onClick={() => handleSort("fecha_creacion")}
                    title="Ordenar por Fecha"
                  >
                    Fecha y Hora {sortConfig.key === "fecha_creacion" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th
                    style={{ width: "160px", cursor: "pointer" }}
                    onClick={() => handleSort("usuario")}
                    title="Ordenar por Usuario"
                  >
                    Usuario {sortConfig.key === "usuario" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th style={{ minWidth: "260px" }}>(Origen ➔ Destino)</th>
                  <th
                    style={{ width: "120px", cursor: "pointer" }}
                    onClick={() => handleSort("clasificacion")}
                  >
                    Clasificación {sortConfig.key === "clasificacion" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th
                    style={{ width: "95px", cursor: "pointer" }}
                    onClick={() => handleSort("peso_mb")}
                  >
                    Peso {sortConfig.key === "peso_mb" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th
                    style={{ width: "140px", cursor: "pointer" }}
                    onClick={() => handleSort("score")}
                    title="Ordenar por Score IF"
                  >
                    Score IF {sortConfig.key === "score" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
                  </th>
                  <th style={{ minWidth: "260px" }}>¿Por qué es anomalía? (Motivo / Causa)</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAnomalias.map((row) => {
                  const numDoc = row.numero_doc || row.id_documento;
                  const rowId = row.id_registro || `${row.id_documento}-${Math.random()}`;
                  const isSelected = selectedFichaRow?.id_registro === row.id_registro;
                  const dateInfo = formatDateTime(row.fecha_creacion);
                  const scoreNum = Number(row.score) || 0;

                  return (
                    <tr
                      key={rowId}
                      className={isSelected ? styles.rowActiveExpanded : ""}
                    >
                      {/* Botón Ver Ficha en Modal */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className={styles.btnVerFicha}
                          onClick={() => setSelectedFichaRow(row)}
                          title="Abrir ficha técnica detallada en ventana modal"
                        >
                          <span>📄</span>
                          <span>Ver Ficha</span>
                        </button>
                      </td>

                      {/* ID Reg. */}
                      <td className={styles.idCell}>
                        <span>#{row.id_registro}</span>
                      </td>

                      {/* Documento con botón copiar */}
                      <td className={styles.docCell}>
                        <div className={styles.docBox}>
                          <div className={styles.docNumRow}>
                            <span className={styles.docNum}>{numDoc ? `#${numDoc}` : "-"}</span>
                            <button
                              type="button"
                              className={styles.copyBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyDoc(numDoc, row.id_registro);
                              }}
                              title="Copiar N° de Documento"
                            >
                              {copiedId === row.id_registro ? "✓" : "📋"}
                            </button>
                          </div>
                          <span className={styles.docSubId}>ID: {row.id_documento || "-"}</span>
                          {row.tipo_documento && (
                            <span className={styles.docTypeBadge}>{row.tipo_documento}</span>
                          )}
                        </div>
                      </td>

                      {/* Botón Ver Flujo / Trazabilidad */}
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className={styles.btnTrazabilidad}
                          onClick={() => {
                            const docId = row.id_documento || row.numero_doc;
                            if (docId && onSelectDoc) {
                              onSelectDoc({
                                id: docId,
                                num: row.numero_doc,
                              });
                            }
                          }}
                          disabled={!(row.id_documento || row.numero_doc)}
                          title={
                            row.id_documento || row.numero_doc
                              ? `Abrir árbol de trazabilidad del expediente #${numDoc || row.id_documento}`
                              : "Sin ID de documento para trazar"
                          }
                        >
                          <span>🗺️</span>
                          <span>Ver Flujo</span>
                        </button>
                      </td>

                      {/* Fecha y Hora completa */}
                      <td className={styles.dateCell}>
                        <div className={styles.dateBox}>
                          <span className={styles.dateDate}>📅 {dateInfo.fecha}</span>
                          <span className={styles.dateTime}>⏰ {dateInfo.hora}</span>
                        </div>
                      </td>

                      {/* Usuario Operador */}
                      <td className={styles.userCell}>
                        <div className={styles.userBox}>
                          <div className={styles.userAvatar}>
                            {(row.usuario || "U").substring(0, 2).toUpperCase()}
                          </div>
                          <div className={styles.userInfo}>
                            <span className={styles.userName} title={row.usuario}>
                              {row.usuario || "DESCONOCIDO"}
                            </span>
                            <span className={styles.userSub}>Operador</span>
                          </div>
                        </div>
                      </td>

                      {/* Ruta de dependencias (Datos Completos sin cortes) */}
                      <td className={styles.routeCell}>
                        <div className={styles.routeFlow}>
                          <div className={styles.routeItem}>
                            <span className={styles.routeIconOut}>📤</span>
                            <span className={styles.routeText} title={row.oficina_origen}>
                              {row.oficina_origen || "Sin oficina origen"}
                            </span>
                          </div>
                          <div className={styles.routeConnector}>
                            <span className={styles.routeLine} />
                            <span className={styles.routeArrow}>↓</span>
                          </div>
                          <div className={styles.routeItem}>
                            <span className={styles.routeIconIn}>📥</span>
                            <span className={styles.routeText} title={row.oficina_destino}>
                              {row.oficina_destino || "Sin oficina destino"}
                            </span>
                          </div>
                          {row.destino && String(row.destino).toLowerCase().includes("exterior") && (
                            <span className={styles.badgeExteriorMini}>🌐 Destino Exterior</span>
                          )}
                        </div>
                      </td>

                      {/* Clasificación */}
                      <td>
                        <span className={getBadgeClass(row.clasificacion)}>
                          {row.clasificacion || "COMÚN"}
                        </span>
                      </td>

                      {/* Peso en MB */}
                      <td className={styles.pesoCell}>
                        {row.peso_mb != null ? (
                          <span className={Number(row.peso_mb) > 15 ? styles.pesoAlert : styles.pesoNormal}>
                            📦 {Number(row.peso_mb).toFixed(2)} MB
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Score IF con barra visual de riesgo */}
                      <td className={styles.scoreCellWrapper}>
                        <div className={styles.scoreBox}>
                          <div className={styles.scoreTopRow}>
                            <span className={`${styles.scoreCell} ${getScoreClass(row.score)}`}>
                              {row.score != null ? Number(row.score).toFixed(4) : "-"}
                            </span>
                            <span className={styles.scoreLevelText}>
                              {scoreNum >= 0.85 ? "Crítico" : scoreNum >= 0.70 ? "Alto" : "Atípico"}
                            </span>
                          </div>
                          <div className={styles.scoreBarTrack}>
                            <div
                              className={`${styles.scoreBarFill} ${
                                scoreNum >= 0.85
                                  ? styles.scoreBarCritical
                                  : scoreNum >= 0.70
                                  ? styles.scoreBarWarning
                                  : styles.scoreBarLow
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, scoreNum * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Motivos explicativos */}
                      <td className={styles.motivosCell}>
                        <div className={styles.motivosWrap}>
                          {row.motivosCalculados.map((motivo, idx) => {
                            const isAlert =
                              motivo.includes("SECRETO") ||
                              motivo.includes("extrema") ||
                              motivo.includes("madrugada");
                            const isWarning =
                              motivo.includes("horario") ||
                              motivo.includes("RESERVADO") ||
                              motivo.includes("externa") ||
                              motivo.includes("Alto score");
                            const chipClass = isAlert
                              ? styles.motivoChipAlert
                              : isWarning
                              ? styles.motivoChipWarning
                              : styles.motivoChipInfo;

                            return (
                              <span key={idx} className={`${styles.motivoChip} ${chipClass}`}>
                                {motivo}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ================= PIE DE PÁGINA CON PAGINACIÓN ================= */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <span>
              Mostrando {paginatedAnomalias.length} de {sortedAnomalias.length} expedientes
              {searchTerm && ` (filtrados por "${searchTerm}")`}
            </span>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="Primera página"
              >
                ⏮
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                title="Página anterior"
              >
                ◀ Anterior
              </button>

              <span className={styles.pageInfo}>
                Página <strong>{page}</strong> de <strong>{totalPages}</strong>
              </span>

              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                title="Página siguiente"
              >
                Siguiente ▶
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                title="Última página"
              >
                ⏭
              </button>
            </div>
          )}

          <div className={styles.footerRight}>
            <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL DE FICHA TÉCNICA COMPLETA ================= */}
      {selectedFichaRow && (
        <div
          className={styles.subModalOverlay}
          onClick={() => setSelectedFichaRow(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.subModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER DE LA FICHA TÉCNICA */}
            <div className={styles.subModalHeader}>
              <div className={styles.subModalHeaderLeft}>
                <div className={styles.subModalIconBox}>📄</div>
                <div>
                  <div className={styles.subModalTag}>Ficha Técnica de Detalle Completo</div>
                  <h3 className={styles.subModalTitle}>
                    Expediente #{selectedFichaRow.numero_doc || selectedFichaRow.id_documento}
                    <span className={styles.subModalSubId}> (Reg. #{selectedFichaRow.id_registro})</span>
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className={styles.subModalCloseBtn}
                onClick={() => setSelectedFichaRow(null)}
                title="Cerrar Ficha Técnica (Esc)"
              >
                ✕
              </button>
            </div>

            {/* BODY DE LA FICHA TÉCNICA CON SCROLL */}
            <div className={styles.subModalBody}>
              {/* BANNER DESTACADO DE SCORE DE ANOMALÍA */}
              <div className={styles.heroScoreBanner}>
                <div className={styles.heroScoreLeft}>
                  <span className={styles.heroScoreLabel}>Score Isolation Forest (Machine Learning)</span>
                  <div className={styles.heroScoreValueRow}>
                    <span className={`${styles.heroScoreNumber} ${getScoreClass(selectedFichaRow.score)}`}>
                      {selectedFichaRow.score != null ? Number(selectedFichaRow.score).toFixed(6) : "-"}
                    </span>
                    <span className={styles.heroScoreBadge}>
                      {Number(selectedFichaRow.score) >= 0.85
                        ? "🔴 Desviación Crítica Extrema"
                        : Number(selectedFichaRow.score) >= 0.70
                        ? "🟠 Alto Riesgo Multivariado"
                        : "🟡 Patrón Atípico Detectado"}
                    </span>
                  </div>
                  <div className={styles.heroScoreBarTrack}>
                    <div
                      className={`${styles.scoreBarFill} ${
                        Number(selectedFichaRow.score) >= 0.85
                          ? styles.scoreBarCritical
                          : Number(selectedFichaRow.score) >= 0.70
                          ? styles.scoreBarWarning
                          : styles.scoreBarLow
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(10, (Number(selectedFichaRow.score) || 0) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
                <div className={styles.heroScoreRight}>
                  <span className={styles.heroMotivosLabel}>Resumen de Factores Atípicos Detectados</span>
                  <div className={styles.heroMotivosList}>
                    {selectedFichaRow.motivosCalculados.map((m, idx) => (
                      <div key={idx} className={styles.heroMotivoItem}>
                        <span className={styles.heroMotivoDot}>•</span>
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ==========================================================================
                  MATRIZ COMPARATIVA: VALOR OBSERVADO VS. COMPORTAMIENTO NORMAL
                  ========================================================================== */}
              <div className={styles.matrizSection}>
                <div className={styles.matrizHeader}>
                  <div className={styles.matrizHeaderTitles}>
                    <span className={styles.matrizIcon}>⚖️</span>
                    <div>
                      <h4 className={styles.matrizTitle}>
                        Matriz de Evaluación: Valor Registrado vs. Comportamiento Normal
                      </h4>
                      <p className={styles.matrizSubtitle}>
                        Evaluación directa de variables (horario, día, peso, clasificación y destino) frente a los umbrales estándar institucionales y reglas de Machine Learning.
                      </p>
                    </div>
                  </div>
                  <div className={styles.matrizSummaryBadge}>
                    <span>
                      {matrizEvaluacion.filter((m) => m.esAnomalo).length} Variables Anómalas
                    </span>
                  </div>
                </div>

                <div className={styles.matrizTableWrap}>
                  <table className={styles.matrizTable}>
                    <thead>
                      <tr>
                        <th style={{ width: "210px" }}>Variable Evaluada</th>
                        <th style={{ width: "230px" }}>Valor Registrado</th>
                        <th style={{ width: "240px" }}>Comportamiento Normal</th>
                        <th style={{ width: "140px", textAlign: "center" }}>Diagnóstico</th>
                        <th style={{ minWidth: "250px" }}>Impacto en la Detección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrizEvaluacion.map((item) => (
                        <tr
                          key={item.id}
                          className={item.esAnomalo ? styles.matrizRowAnomalo : styles.matrizRowNormal}
                        >
                          <td className={styles.matrizParamCell}>
                            <span className={styles.paramIcon}>{item.icon}</span>
                            <strong>{item.parametro}</strong>
                          </td>
                          <td className={styles.matrizValueCell}>
                            <span
                              className={
                                item.esAnomalo ? styles.valHighlightAnomalo : styles.valHighlightNormal
                              }
                            >
                              {item.valorObservado}
                            </span>
                          </td>
                          <td className={styles.matrizNormalCell}>
                            <span>{item.rangoNormal}</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span
                              className={
                                item.esAnomalo
                                  ? item.nivel === "critico"
                                    ? styles.diagBadgeCritico
                                    : styles.diagBadgeAlerta
                                  : styles.diagBadgeNormal
                              }
                            >
                              {item.esAnomalo
                                ? item.nivel === "critico"
                                  ? "🔴 ANÓMALO (CRÍTICO)"
                                  : "⚠️ ANÓMALO"
                                : "✅ NORMAL"}
                            </span>
                          </td>
                          <td className={styles.matrizImpactCell}>
                            <span>{item.impacto}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GRID DE CUADRANTES DE INFORMACIÓN COMPLETA */}
              <div className={styles.fichaGrid}>
                {/* CUADRANTE 1: DATOS DEL EXPEDIENTE */}
                <div className={styles.fichaCard}>
                  <div className={styles.fichaCardHeader}>
                    <span>📁</span>
                    <h4>Información del Documento</h4>
                  </div>
                  <div className={styles.fichaCardBody}>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>N° Documento / Expediente</span>
                      <div className={styles.fichaFieldValueRow}>
                        <strong className={styles.fichaFieldValueHighlight}>
                          {selectedFichaRow.numero_doc || selectedFichaRow.id_documento || "-"}
                        </strong>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() =>
                            handleCopyDoc(
                              selectedFichaRow.numero_doc || selectedFichaRow.id_documento,
                              "modal"
                            )
                          }
                          title="Copiar N° Documento"
                        >
                          {copiedId === "modal" ? "✓ Copiado" : "📋 Copiar"}
                        </button>
                      </div>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>ID Interno de Documento</span>
                      <span className={styles.fichaFieldValue}>{selectedFichaRow.id_documento || "-"}</span>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Tipo de Documento</span>
                      <span className={styles.fichaFieldValue}>
                        {selectedFichaRow.tipo_documento || "DOCUMENTO GENERAL"}
                      </span>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Clasificación de Seguridad</span>
                      <span className={getBadgeClass(selectedFichaRow.clasificacion)}>
                        {selectedFichaRow.clasificacion || "COMÚN"}
                      </span>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Nivel de Prioridad</span>
                      <span className={styles.fichaFieldValue}>{selectedFichaRow.prioridad || "NORMAL"}</span>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Estado Actual del Trámite</span>
                      <span className={styles.fichaFieldValue}>{selectedFichaRow.estado || "REGISTRADO"}</span>
                    </div>
                  </div>
                </div>

                {/* CUADRANTE 2: RUTA Y DEPENDENCIAS COMPLETAS */}
                <div className={styles.fichaCard}>
                  <div className={styles.fichaCardHeader}>
                    <span>🏢</span>
                    <h4>Ruta y Dependencias Completas</h4>
                  </div>
                  <div className={styles.fichaCardBody}>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Dependencia / Oficina de Origen</span>
                      <div className={styles.fichaFullTextBox}>
                        <span className={styles.officeIcon}>📤</span>
                        <strong>{selectedFichaRow.oficina_origen || "Sin oficina origen registrada"}</strong>
                      </div>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Dependencia / Oficina de Destino</span>
                      <div className={styles.fichaFullTextBox}>
                        <span className={styles.officeIcon}>📥</span>
                        <strong>{selectedFichaRow.oficina_destino || "Sin oficina destino registrada"}</strong>
                      </div>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Modalidad de Despacho</span>
                      <span className={styles.fichaFieldValue}>
                        {selectedFichaRow.destino || "INTERNA"}
                        {selectedFichaRow.destino &&
                          String(selectedFichaRow.destino).toLowerCase().includes("exterior") && (
                            <span className={styles.badgeExteriorMini} style={{ marginLeft: "0.5rem" }}>
                              🌐 Enlace Exterior
                            </span>
                          )}
                      </span>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Peso del Archivo Adjunto</span>
                      <span className={styles.fichaFieldValue}>
                        {selectedFichaRow.peso_mb != null
                          ? `${Number(selectedFichaRow.peso_mb).toFixed(2)} MB`
                          : "No registrado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CUADRANTE 3: AUDITORÍA Y TEMPORALIDAD */}
                <div className={styles.fichaCard}>
                  <div className={styles.fichaCardHeader}>
                    <span>👤</span>
                    <h4>Auditoría y Parámetros Temporales</h4>
                  </div>
                  <div className={styles.fichaCardBody}>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Usuario Operador Responsable</span>
                      <div className={styles.userBox}>
                        <div className={styles.userAvatar}>
                          {(selectedFichaRow.usuario || "U").substring(0, 2).toUpperCase()}
                        </div>
                        <strong className={styles.userName}>{selectedFichaRow.usuario || "DESCONOCIDO"}</strong>
                      </div>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Fecha y Hora de Creación</span>
                      <span className={styles.fichaFieldValue}>
                        📅 {formatDateTime(selectedFichaRow.fecha_creacion).fecha} &nbsp; ⏰{" "}
                        {formatDateTime(selectedFichaRow.fecha_creacion).hora}
                        <span className={styles.rawTimestamp}>({selectedFichaRow.fecha_creacion})</span>
                      </span>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Evaluación de Horario Laboral</span>
                      <span className={styles.fichaFieldValue}>
                        {selectedFichaRow.motivosCalculados.some(
                          (m) => m.includes("horario") || m.includes("jornada") || m.includes("madrugada")
                        ) ? (
                          <span style={{ color: "#ea580c", fontWeight: 700 }}>
                            🌙 Registro fuera de jornada laboral (08:00 - 16:00)
                          </span>
                        ) : (
                          <span style={{ color: "#16a34a", fontWeight: 700 }}>
                            ☀️ Registro dentro del horario laboral estándar
                          </span>
                        )}
                      </span>
                    </div>
                    <div className={styles.fichaField}>
                      <span className={styles.fichaFieldLabel}>Día de la Semana</span>
                      <span className={styles.fichaFieldValue}>
                        {(() => {
                          if (!selectedFichaRow.fecha_creacion) return "-";
                          const diasSem = [
                            "Domingo",
                            "Lunes",
                            "Martes",
                            "Miércoles",
                            "Jueves",
                            "Viernes",
                            "Sábado",
                          ];
                          const d = new Date(selectedFichaRow.fecha_creacion);
                          return isNaN(d.getDay()) ? "-" : diasSem[d.getDay()];
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN XAI: DESGLOSE DE RAREZA ESTADÍSTICA (ISOLATION FOREST) */}
              <SeccionRarezaEstadistica row={selectedFichaRow} />
            </div>

            {/* FOOTER DE LA FICHA TÉCNICA */}
            <div className={styles.subModalFooter}>
              <div className={styles.subModalFooterLeft}>
                <span className={styles.subModalFooterNote}>
                  💡 Registro auditado por el modelo multivariado Isolation Forest.
                </span>
              </div>
              <div className={styles.subModalFooterRight}>
                <button
                  type="button"
                  className={styles.subModalTrazabilidadBtn}
                  onClick={() => {
                    const docId = selectedFichaRow.id_documento || selectedFichaRow.numero_doc;
                    if (docId && onSelectDoc) {
                      onSelectDoc({
                        id: docId,
                        num: selectedFichaRow.numero_doc,
                      });
                    }
                  }}
                  disabled={!(selectedFichaRow.id_documento || selectedFichaRow.numero_doc)}
                >
                  <span>🗺️</span>
                  <span>Ver Árbol de Trazabilidad Completo</span>
                </button>
                <button
                  type="button"
                  className={styles.subModalCloseActionBtn}
                  onClick={() => setSelectedFichaRow(null)}
                >
                  Cerrar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
