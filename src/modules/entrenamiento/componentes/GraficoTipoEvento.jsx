import { useState, useMemo } from "react";
import styles from "./GraficoTipoEvento.module.css";
import { toast } from "sonner";

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
    sub: "Lectura / visualización de documento",
    cantidad: 0,
    color: "#64748b",
    peso_accion: 1.0,
    nivel: "bajo",
  },
  {
    id: "DESCARGAR",
    nombre: "DESCARGAR",
    sub: "Descarga y tenencia de copia local",
    cantidad: 0,
    color: "#eab308",
    peso_accion: 2.0,
    nivel: "alto",
  },
  {
    id: "EDITAR",
    nombre: "EDITAR",
    sub: "Modificación o alteración de documento",
    cantidad: 0,
    color: "#3b82f6",
    peso_accion: 2.0,
    nivel: "medio",
  },
  {
    id: "ELIMINAR",
    nombre: "ELIMINAR",
    sub: "Destrucción / sabotaje de registro (Riesgo máximo)",
    cantidad: 0,
    color: "#ef4444",
    peso_accion: 3.0,
    nivel: "critico",
  },
  {
    id: "GUARDAR_COPIA",
    nombre: "GUARDAR_COPIA",
    sub: "Duplicación de archivo / riesgo de fuga",
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

  const getBadgeVariantClass = (id) => {
    switch (id?.toUpperCase()) {
      case "VISTA":
        return styles.badgeVista;
      case "DESCARGAR":
        return styles.badgeDescargar;
      case "EDITAR":
        return styles.badgeEditar;
      case "ELIMINAR":
        return styles.badgeEliminar;
      case "GUARDAR_COPIA":
        return styles.badgeGuardarCopia;
      default:
        return "";
    }
  };

  const nombreMesActual =
    MESES.find((m) => m.id === mesSeleccionado)?.label || "Todo el año";

  return (
    <div className={styles.card}>
      {/* Cabecera del gráfico con selector de meses */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.headerTitleRow}>
            <span className={styles.columnHeaderBadge}>Evento</span>
            <h3 className={styles.title}>Tipos de Evento</h3>
          </div>
          <p className={styles.subtitle}>
            {mesSeleccionado === "todos"
              ? "Telemetría y acciones UEBA de usuarios (Todo el año)"
              : `Telemetría y acciones UEBA registradas en ${nombreMesActual}`}
          </p>
        </div>

        <div>
          {/* Selector de meses de Enero a Diciembre */}
          <select
            className={styles.periodSelect}
            value={mesSeleccionado}
            onChange={handleMesChange}
            title="Filtrar telemetría de eventos por mes (Enero a Diciembre)"
          >
            {MESES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de barras horizontales por cada tipo de evento */}
      <div className={styles.channelList}>
        {items.map((item) => {
          // Si cantidad es 0, barra en 0; de lo contrario escala proporcional
          const pct =
            item.cantidad === 0
              ? 0
              : Math.min(
                  100,
                  Math.max(
                    12,
                    Math.round((Math.sqrt(item.cantidad) / Math.sqrt(maxVal)) * 100)
                  )
                );
          const tipoFiltro = item.id === "DESCARGAR" ? "DESCARGA" : item.id;
          const isActive =
            filtros.tipo_evento?.toUpperCase() === tipoFiltro.toUpperCase() ||
            filtros.tipo_evento?.toUpperCase() === item.id.toUpperCase() ||
            filtros.busqueda?.toUpperCase() === item.nombre.toUpperCase();

          return (
            <div
              key={item.id}
              className={`${styles.channelRow} ${
                isActive ? styles.channelRowActive : ""
              }`}
              onClick={() => handleEventClick(item)}
              title={`Clic para filtrar incidentes por ${item.nombre} (${item.cantidad.toLocaleString()} registros) — ${item.sub}`}
            >
              {/* Badge idéntico a la imagen de referencia */}
              <div className={styles.badgeCol}>
                <span
                  className={`${styles.eventBadge} ${getBadgeVariantClass(
                    item.id
                  )}`}
                >
                  {item.nombre}
                </span>
               
              </div>

              {/* Barra de progreso interactiva */}
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: item.color,
                    color: item.color,
                    opacity: item.cantidad === 0 ? 0.2 : 1,
                  }}
                />
              </div>

              {/* Valor numérico de eventos */}
              <span
                className={styles.channelValue}
                style={{ opacity: item.cantidad === 0 ? 0.5 : 1 }}
                title={`${item.cantidad.toLocaleString()} eventos`}
              >
                {item.cantidad.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pie de tarjeta con indicador de filtros activos */}
      <div className={styles.cardFooter}>
        <span className={styles.footerNotice}>
          {mesSeleccionado !== "todos"
            ? `Mostrando registros del mes de ${nombreMesActual}`
            : "Monitoreo forense UEBA & Trazabilidad Documental"}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {mesSeleccionado !== "todos" && (
            <span className={styles.filterBadgeActive}>
              Mes: {nombreMesActual}
              <button
                type="button"
                className={styles.btnClearFilter}
                onClick={() =>
                  handleMesChange({ target: { value: "todos" } })
                }
                title="Quitar filtro de mes"
              >
                (todo)
              </button>
            </span>
          )}

          {(filtros.tipo_evento || filtros.busqueda) && (
            <span className={styles.filterBadgeActive}>
              Evento: {filtros.tipo_evento || filtros.busqueda}
              <button
                type="button"
                className={styles.btnClearFilter}
                onClick={() =>
                  setFiltros((prev) => ({ ...prev, tipo_evento: "", busqueda: "" }))
                }
                title="Quitar filtro de evento"
              >
                (quitar)
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
