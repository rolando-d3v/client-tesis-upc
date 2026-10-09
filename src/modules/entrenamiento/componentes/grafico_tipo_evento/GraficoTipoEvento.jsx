import { useState, useMemo } from "react";
import styles from "./GraficoTipoEvento.module.css";
import { toast } from "sonner";
import { FaBolt } from "react-icons/fa6";

// Meses del año para el selector
const MESES = [
  { id: "todos", label: "Todo el año" },
  { id: "01", label: "Enero" },
  { id: "02", label: "Febrero" },
  { id: "03", label: "Marzo" },
  { id: "04", label: "Abril" },
  { id: "05", label: "Mayo" },
  { id: "06", label: "Junio" },
  { id: "07", label: "Julio" },
  { id: "08", label: "Agosto" },
  { id: "09", label: "Setiembre" },
  { id: "10", label: "Octubre" },
  { id: "11", label: "Noviembre" },
  { id: "12", label: "Diciembre" },
];

// Metadatos de los tipos oficiales; sin datos recibidos, los conteos son cero.
const DEFAULT_EVENT_TYPES = [
  {
    id: "VISTA",
    nombre: "VISTA",

    cantidad: 0,
    color: "#64748b",
    peso_accion: 1.0,
    nivel: "bajo",
  },
  {
    id: "DESCARGAR",
    nombre: "DESCARGAR",

    cantidad: 0,
    color: "#eab308",
    peso_accion: 2.0,
    nivel: "alto",
  },
  {
    id: "EDITAR",
    nombre: "EDITAR",

    cantidad: 0,
    color: "#3b82f6",
    peso_accion: 2.0,
    nivel: "medio",
  },
  {
    id: "ELIMINAR",
    nombre: "ELIMINAR",

    cantidad: 0,
    color: "#ef4444",
    peso_accion: 3.0,
    nivel: "critico",
  },
  {
    id: "GUARDAR_COPIA",
    nombre: "GUARDAR_COPIA",

    cantidad: 0,
    color: "#f97316",
    peso_accion: 2.5,
    nivel: "alto",
  },
];

export default function GraficoTipoEvento({
  resumen,
  filtros = {},
  setFiltros,
  setPage,
}) {
  const [mesLocal, setMesLocal] = useState(filtros?.mes || "todos");
  const mesActivo = setFiltros ? filtros?.mes || "todos" : mesLocal;
  // La API agrupa por MM, incluso cuando otro gráfico filtra con YYYY-MM.
  const mesSeleccionado = mesActivo === "todos" ? "todos" : String(mesActivo).slice(-2);

  // Manejo del cambio de mes en el selector
  const handleMesChange = (e) => {
    const nuevoMes = e.target.value;
    setMesLocal(nuevoMes);

    if (setFiltros) {
      setFiltros((prev) => ({
        ...prev,
        mes: nuevoMes === "todos" ? "" : nuevoMes,
      }));
      if (setPage) setPage(1);
    }

    const mesObj = MESES.find((m) => m.id === nuevoMes);
    if (nuevoMes === "todos") {
      toast.info("Mostrando eventos de todo el año");
    } else {
      toast.info(`Filtrando telemetría de eventos por: ${mesObj?.label || nuevoMes}`);
    }
  };

  // Procesar tipos de eventos según el mes seleccionado
  const items = useMemo(() => {
    const mensualData = resumen?.tipos_eventos_por_mes;
    let rawList;

    if (mesSeleccionado === "todos") {
      rawList =
        resumen?.tipos_eventos ||
        mensualData?.todos ||
        resumen?.canales_fuga ||
        DEFAULT_EVENT_TYPES;
    } else if (mensualData && mensualData[mesSeleccionado]) {
      rawList = mensualData[mesSeleccionado];
    } else {
      // Meses sin registros o datos no cargados
      rawList = DEFAULT_EVENT_TYPES.map((d) => ({
        ...d,
        cantidad: 0,
      }));
    }

    const eventMap = new Map();
    rawList.forEach((it) => {
      const idKey = (it.id || it.nombre || "").toUpperCase();
      eventMap.set(idKey, it);
    });

    // Orden exacto de la imagen de referencia:
    // 1. VISTA, 2. DESCARGAR, 3. EDITAR, 4. ELIMINAR, 5. GUARDAR_COPIA
    const orderedKeys = ["VISTA", "DESCARGAR", "EDITAR", "ELIMINAR", "GUARDAR_COPIA"];
    return orderedKeys.map((key) => {
      const found = eventMap.get(key);
      const fallback = DEFAULT_EVENT_TYPES.find((d) => d.id === key);
      return {
        id: key,
        nombre: key,
        sub: found?.sub || fallback?.sub || "",
        cantidad: Number(found?.cantidad ?? 0),
        color: found?.color || fallback?.color || "#3b82f6",
        peso_accion: found?.peso_accion || fallback?.peso_accion || 1.0,
        nivel: found?.nivel || fallback?.nivel || "bajo",
      };
    });
  }, [resumen?.tipos_eventos, resumen?.tipos_eventos_por_mes, resumen?.canales_fuga, mesSeleccionado]);

  // Valor máximo para la escala visual de barras del período
  const maxVal = useMemo(() => {
    return Math.max(...items.map((i) => i.cantidad), 1);
  }, [items]);

  // Total acumulado de eventos en el período
  const totalEventos = useMemo(() => {
    return items.reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [items]);

  // Manejo de clic para filtrar por acción de evento
  const handleEventClick = (item) => {
    if (!setFiltros) return;

    const tipoFiltro = item.id === "DESCARGAR" ? "DESCARGA" : item.id;
    const isCurrentlyActive =
      filtros.tipo_evento?.toUpperCase() === tipoFiltro.toUpperCase() ||
      filtros.tipo_evento?.toUpperCase() === item.id.toUpperCase();

    if (isCurrentlyActive) {
      setFiltros((prev) => ({ ...prev, tipo_evento: "" }));
      toast.info(`Filtro por ${item.nombre} desactivado`);
    } else {
      setFiltros((prev) => ({
        ...prev,
        tipo_evento: tipoFiltro,
      }));
      if (setPage) setPage(1);
      toast.success(`Filtrando incidentes por evento: ${item.nombre}`);
    }
  };

  const etiquetas = {
    VISTA: "Visualización",
    DESCARGAR: "Descarga",
    EDITAR: "Edición",
    ELIMINAR: "Eliminación",
    GUARDAR_COPIA: "Guardar copia",
  };
  const nombreMesActual =
    MESES.find((m) => m.id === mesSeleccionado)?.label || "Todo el año";

  return (
    <section className={styles.card} aria-label="Tipos de evento y acciones">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <FaBolt className={styles.iconBadge} aria-hidden="true" />
          <h3 className={styles.title}>Tipos de evento</h3>
          <span className={styles.total} title={`${totalEventos.toLocaleString()} eventos · ${nombreMesActual}`}>
            <strong>{totalEventos.toLocaleString()}</strong> eventos
          </span>
        </div>
        <div className={styles.controls}>
          {setFiltros && (filtros.tipo_evento || filtros.busqueda) && (
            <button
              type="button"
              className={styles.btnClearFilter}
              onClick={() => {
                setFiltros((prev) => ({ ...prev, tipo_evento: "", busqueda: "" }));
                if (setPage) setPage(1);
              }}
              aria-label="Quitar filtro de evento"
              title={`Quitar filtro: ${filtros.tipo_evento || filtros.busqueda}`}
            >
              ×
            </button>
          )}
          <select
            className={styles.periodSelect}
            value={mesSeleccionado}
            onChange={handleMesChange}
            aria-label="Filtrar eventos por mes"
          >
            {MESES.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.channelList}>
        {items.map((item) => {
          const pct = Math.min(100, Math.max(0, (item.cantidad / maxVal) * 100));
          const tipoFiltro = item.id === "DESCARGAR" ? "DESCARGA" : item.id;
          const isActive =
            filtros.tipo_evento?.toUpperCase() === tipoFiltro ||
            filtros.tipo_evento?.toUpperCase() === item.id ||
            filtros.busqueda?.toUpperCase() === item.nombre;

          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.channelRow} ${isActive ? styles.channelRowActive : ""}`}
              onClick={() => handleEventClick(item)}
              disabled={!setFiltros}
              aria-pressed={isActive}
              aria-label={`${item.nombre}: ${item.cantidad.toLocaleString()} eventos`}
              title={`${item.nombre}: ${item.cantidad.toLocaleString()} eventos${item.sub ? ` · ${item.sub}` : ""}`}
            >
              <span className={styles.channelInfo}>
                <span className={styles.eventName}>
                  <span className={styles.colorDot} style={{ backgroundColor: item.color }} />
                  {etiquetas[item.id]}
                </span>
                <strong className={styles.channelValue}>
                  {item.cantidad.toLocaleString()} <span className={styles.channelUnit}>eventos</span>
                </strong>
              </span>
              <span className={styles.barTrack} aria-hidden="true">
                <span className={styles.barFill} style={{ width: `${pct}%`, backgroundColor: item.color }} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
