import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import styles from "./ArbolTrazabilidad.module.css";

// Medidas y dimensiones base del layout DAG (Movimiento: 410x250, Origen: 400x450)
const ORIGIN_W = 400;
const ORIGIN_H = 450;
const STEP_W = 410;
const STEP_H = 250;

const GAP_X = 95;
const GAP_Y = 32;
const PADDING_X = 60;
const PADDING_Y = 60;

function formatDateTime(dateStr) {
  if (!dateStr || dateStr === "-") return { fecha: "-", hora: "" };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { fecha: String(dateStr), hora: "" };
    const pad = (n) => String(n).padStart(2, "0");
    const fecha = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    const hora = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return { fecha, hora };
  } catch {
    return { fecha: String(dateStr), hora: "" };
  }
}

const isExteriorPaso = (p) =>
  Boolean(p?.es_exterior || (p?.destino && String(p.destino).toLowerCase().includes("exterior")));

export default function ArbolTrazabilidad({ info = {}, pasos = [], activePaso = null, onSelectPaso = null }) {
  const containerRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const [pan, setPan] = useState({ x: 60, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [internalSelectedPaso, setInternalSelectedPaso] = useState(null);
  const [hoveredPasoId, setHoveredPasoId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'anomalias' | 'exterior'
  const [showHint, setShowHint] = useState(true);

  // El paso actualmente seleccionado (prop externa o estado interno)
  const currentSelectedPaso = activePaso || internalSelectedPaso;

  const handleSelectPaso = useCallback(
    (p) => {
      setInternalSelectedPaso(p);
      if (onSelectPaso) onSelectPaso(p);
    },
    [onSelectPaso],
  );

  // Auto-ocultar hint a los 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  // Conteos para filtros
  const totalAnomalias = useMemo(() => pasos.filter((p) => p.es_anomalo).length, [pasos]);
  const totalExterior = useMemo(() => pasos.filter(isExteriorPaso).length, [pasos]);

  // 1. Motor de Layout DAG: Reconstrucción fiel del flujo causal de la trazabilidad
  const layout = useMemo(() => {
    if (!pasos || pasos.length === 0) return null;

    const nodes = [];
    const nodeMap = new Map();
    const childrenMap = new Map();

    // Nodo 0: Documento de Origen (Root)
    const rootNode = {
      id: "ROOT",
      type: "ROOT",
      column: 0,
      width: ORIGIN_W,
      height: ORIGIN_H,
      x: PADDING_X,
      y: 0,
      centerY: 0,
      data: info,
    };
    nodeMap.set("ROOT", rootNode);
    childrenMap.set("ROOT", []);

    // Construcción de nodos de pasos con inferencia de dependencias de custodia
    pasos.forEach((p, idx) => {
      const id = p.id_registro || p.paso || `step-${idx + 1}`;
      const height = STEP_H;

      // Determinar padre causal
      let parentId = "ROOT";
      if (idx > 0) {
        let foundParent = null;
        for (let j = idx - 1; j >= 0; j--) {
          const prev = pasos[j];
          const prevId = prev.id_registro || prev.paso || `step-${j + 1}`;
          // Caso 1: La oficina de destino del paso j es el origen de este paso
          if (prev.oficina_destino && p.oficina_origen && prev.oficina_destino === p.oficina_origen) {
            foundParent = prevId;
            break;
          }
          // Caso 2: Derivación concurrente desde la misma oficina de origen (Bifurcación)
          if (prev.oficina_origen && p.oficina_origen && prev.oficina_origen === p.oficina_origen) {
            const prevNode = nodeMap.get(prevId);
            if (prevNode) {
              foundParent = prevNode.parentId;
              break;
            }
          }
        }
        parentId = foundParent || pasos[idx - 1].id_registro || pasos[idx - 1].paso || `step-${idx}`;
      }

      const node = {
        id,
        type: "STEP",
        item: p,
        index: idx + 1,
        parentId,
        width: STEP_W,
        height,
        column: 1,
        x: 0,
        y: 0,
        centerY: 0,
      };
      nodes.push(node);
      nodeMap.set(id, node);
      childrenMap.set(id, []);
    });

    // Enlazar hijos y computar columnas (profundidad en el árbol)
    nodes.forEach((node) => {
      const parent = nodeMap.get(node.parentId) || rootNode;
      node.column = (parent.column || 0) + 1;
      if (!childrenMap.has(parent.id)) {
        childrenMap.set(parent.id, []);
      }
      childrenMap.get(parent.id).push(node);
    });

    // Marcar nodos terminales ("en que oficina acaba")
    nodes.forEach((node) => {
      node.isTerminal = (childrenMap.get(node.id) || []).length === 0;
    });

    // Agrupar por columnas
    const maxCol = Math.max(...nodes.map((n) => n.column), 1);
    const columns = Array.from({ length: maxCol + 1 }, () => []);
    columns[0].push(rootNode);
    nodes.forEach((node) => {
      columns[node.column].push(node);
    });

    // Asignar X para cada columna
    columns.forEach((colNodes, colIdx) => {
      const colX = colIdx === 0 ? PADDING_X : PADDING_X + ORIGIN_W + GAP_X + (colIdx - 1) * (STEP_W + GAP_X);
      colNodes.forEach((node) => {
        node.x = colX;
      });
    });

    // Posicionamiento Y:
    // 1. Columnas terminales (de derecha a izquierda apilando verticalmente)
    for (let c = maxCol; c >= 1; c--) {
      const colNodes = columns[c];
      let currY = PADDING_Y;
      colNodes.forEach((node) => {
        node.y = currY;
        node.centerY = node.y + node.height / 2;
        currY += node.height + GAP_Y;
      });
    }

    // 2. Centrado vertical de padres respecto al promedio de sus hijos
    for (let c = maxCol - 1; c >= 1; c--) {
      const colNodes = columns[c];
      colNodes.forEach((node) => {
        const children = childrenMap.get(node.id);
        if (children && children.length > 0) {
          const avgCenterY = children.reduce((acc, ch) => acc + ch.centerY, 0) / children.length;
          node.centerY = avgCenterY;
          node.y = avgCenterY - node.height / 2;
        }
      });
    }

    // 3. Centrado vertical de Documento Origen (ROOT)
    const rootChildren = childrenMap.get("ROOT");
    if (rootChildren && rootChildren.length > 0) {
      const rootAvgCenterY = rootChildren.reduce((acc, ch) => acc + ch.centerY, 0) / rootChildren.length;
      rootNode.centerY = rootAvgCenterY;
      rootNode.y = rootAvgCenterY - rootNode.height / 2;
    } else {
      rootNode.y = PADDING_Y;
      rootNode.centerY = rootNode.y + rootNode.height / 2;
    }

    // Normalizar para que ningún nodo quede por encima del margen superior PADDING_Y
    const allNodes = [rootNode, ...nodes];
    const minY = Math.min(...allNodes.map((n) => n.y));
    if (minY < PADDING_Y) {
      const shiftY = PADDING_Y - minY;
      allNodes.forEach((n) => {
        n.y += shiftY;
        n.centerY += shiftY;
      });
    }

    // Resolver colisiones verticales entre nodos de la misma columna
    for (let c = 1; c <= maxCol; c++) {
      const colNodes = columns[c];
      if (colNodes.length > 1) {
        colNodes.sort((a, b) => a.y - b.y);
        for (let i = 1; i < colNodes.length; i++) {
          const prev = colNodes[i - 1];
          const curr = colNodes[i];
          if (curr.y < prev.y + prev.height + GAP_Y) {
            const shift = prev.y + prev.height + GAP_Y - curr.y;
            curr.y += shift;
            curr.centerY += shift;
          }
        }
      }
    }

    // 4. Conectores SVG (Conexiones directas, Troncos y Ramificaciones con Junction Dots)
    const connections = [];
    const junctionDots = [];

    allNodes.forEach((parentNode) => {
      const children = childrenMap.get(parentNode.id) || [];
      if (children.length === 0) return;

      const xOut = parentNode.x + parentNode.width;
      const yOut = parentNode.centerY;

      if (children.length === 1) {
        // Conexión simple
        const child = children[0];
        const xIn = child.x;
        const yIn = child.centerY;
        let pathD;
        if (Math.abs(yOut - yIn) < 3) {
          pathD = `M ${xOut} ${yOut} H ${xIn}`;
        } else {
          const midX = (xOut + xIn) / 2;
          pathD = `M ${xOut} ${yOut} C ${midX} ${yOut}, ${midX} ${yIn}, ${xIn} ${yIn}`;
        }
        connections.push({
          id: `conn-${parentNode.id}-${child.id}`,
          pathD,
          parentId: parentNode.id,
          childId: child.id,
          tieneAnomalia: child.item?.es_anomalo,
        });
      } else {
        // Bifurcación (como en el Paso 2 hacia Paso 3 y Paso 4)
        const firstChild = children[0];
        const xIn = firstChild.x;
        const xFork = xOut + Math.min(45, (xIn - xOut) * 0.45);

        // Tronco horizontal hasta el punto de bifurcación
        connections.push({
          id: `conn-stem-${parentNode.id}`,
          pathD: `M ${xOut} ${yOut} H ${xFork}`,
          parentId: parentNode.id,
          childId: null,
          tieneAnomalia: false,
        });

        // Punto de unión (Junction dot) en la bifurcación
        junctionDots.push({
          id: `junction-${parentNode.id}`,
          x: xFork,
          y: yOut,
        });

        // Ramas curvas hacia cada hijo
        children.forEach((child) => {
          const yIn = child.centerY;
          const branchD = `M ${xFork} ${yOut} C ${xFork + 32} ${yOut}, ${child.x - 32} ${yIn}, ${child.x} ${yIn}`;
          connections.push({
            id: `conn-${parentNode.id}-${child.id}`,
            pathD: branchD,
            parentId: parentNode.id,
            childId: child.id,
            tieneAnomalia: child.item?.es_anomalo,
          });
        });
      }
    });

    const totalWidth = Math.max(...allNodes.map((n) => n.x + n.width)) + PADDING_X * 2;
    const totalHeight = Math.max(...allNodes.map((n) => n.y + n.height)) + PADDING_Y * 2;

    return {
      rootNode,
      stepNodes: nodes,
      allNodes,
      connections,
      junctionDots,
      totalWidth,
      totalHeight,
    };
  }, [pasos, info]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      setViewportSize({ width: container.clientWidth, height: container.clientHeight });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [layout]);

  // Centrar o ajustar el árbol al contenedor
  const handleFitToView = useCallback(() => {
    if (!layout || !containerRef.current) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    const scaleX = (cw - 80) / layout.totalWidth;
    const scaleY = (ch - 80) / layout.totalHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.0);

    const newPanX = (cw - layout.totalWidth * newZoom) / 2;
    const newPanY = (ch - layout.totalHeight * newZoom) / 2;

    setZoom(Number(newZoom.toFixed(2)));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  }, [layout]);

  // Auto-ajuste inicial al montar o cambiar datos
  useEffect(() => {
    if (layout) {
      handleFitToView();
    }
  }, [layout, handleFitToView]);

  // Centrar un nodo específico suavemente en pantalla
  const handleCenterNode = useCallback(
    (node) => {
      if (!containerRef.current || !node) return;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const targetZoom = Math.max(zoom, 1.0);
      const targetPanX = cw / 2 - (node.x + node.width / 2) * targetZoom;
      const targetPanY = ch / 2 - (node.y + node.height / 2) * targetZoom;

      setZoom(targetZoom);
      setPan({ x: Math.round(targetPanX), y: Math.round(targetPanY) });
    },
    [zoom],
  );

  // Atajos de teclado (Zoom y Reset)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(2.5, Number((z * 1.15).toFixed(2))));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(0.25, Number((z / 1.15).toFixed(2))));
      } else if (e.key === "0") {
        handleFitToView();
      } else if (e.key === "Escape") {
        handleSelectPaso(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFitToView, handleSelectPaso]);

  // Manejo de Drag (Pan) con ratón
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Manejo de Zoom con rueda del ratón
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.12;
    const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
    const newZoom = Math.min(Math.max(zoom * delta, 0.25), 2.2);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(Number(newZoom.toFixed(2)));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2.5, Number((prev * 1.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.25, Number((prev / 1.15).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 60, y: 50 });
  };

  // Función de evaluación de visibilidad por búsqueda o filtro
  const isNodeMatching = useCallback(
    (item) => {
      if (!item) return true;

      // Filtro por tipo
      if (filterType === "anomalias" && !item.es_anomalo) return false;
      if (filterType === "exterior" && !isExteriorPaso(item)) return false;

      // Búsqueda por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchOrig = item.oficina_origen?.toLowerCase().includes(q);
        const matchDest = item.oficina_destino?.toLowerCase().includes(q);
        const matchUser = item.usuario?.toLowerCase().includes(q);
        const matchState = item.estado?.toLowerCase().includes(q);
        if (!matchOrig && !matchDest && !matchUser && !matchState) return false;
      }

      return true;
    },
    [filterType, searchQuery],
  );

  // Minimap calculations & click-to-pan
  const miniWidth = 150;
  const miniHeight = 95;
  const miniScale = layout ? Math.min(miniWidth / layout.totalWidth, miniHeight / layout.totalHeight) : 0.1;
  const viewportRectX = layout ? Math.max(0, -pan.x / zoom) * miniScale : 0;
  const viewportRectY = layout ? Math.max(0, -pan.y / zoom) * miniScale : 0;
  const viewportRectW = layout ? Math.min(layout.totalWidth, viewportSize.width / zoom) * miniScale : 0;
  const viewportRectH = layout ? Math.min(layout.totalHeight, viewportSize.height / zoom) * miniScale : 0;

  const handleMinimapClick = (e) => {
    if (!layout || !containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / miniScale;
    const clickY = (e.clientY - rect.top) / miniScale;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;

    setPan({
      x: Math.round(cw / 2 - clickX * zoom),
      y: Math.round(ch / 2 - clickY * zoom),
    });
  };

  if (!layout) {
    return (
      <div className={styles.viewportContainer} style={{ alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#94a3b8" }}>Cargando diagrama de trazabilidad...</p>
      </div>
    );
  }

  // Comprobar si un nodo está seleccionado activamente
  const activeItemId = currentSelectedPaso?.id_registro || currentSelectedPaso?.paso;

  return (
    <div
      ref={containerRef}
      className={`${styles.viewportContainer} ${isFullscreen ? styles.viewportContainerFullscreen : ""}`}
      onWheel={handleWheel}
    >
      {/* ================= BARRA SUPERIOR DE BÚSQUEDA Y FILTROS ================= */}
      <div className={styles.topActionBar}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar oficina, usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.searchClearBtn}
              onClick={() => setSearchQuery("")}
              title="Borrar búsqueda"
              type="button"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.filterChips}>
          <button
            type="button"
            className={`${styles.filterChip} ${filterType === "all" ? styles.filterChipActive : ""}`}
            onClick={() => setFilterType("all")}
          >
            <span>Todos</span>
            <span>({pasos.length})</span>
          </button>

          <button
            type="button"
            className={`${styles.filterChip} ${filterType === "anomalias" ? styles.filterChipActiveAlert : ""}`}
            onClick={() => setFilterType("anomalias")}
          >
            <span>⚠️ Anomalías</span>
            <span>({totalAnomalias})</span>
          </button>

          {totalExterior > 0 && (
            <button
              type="button"
              className={`${styles.filterChip} ${filterType === "exterior" ? styles.filterChipActive : ""}`}
              onClick={() => setFilterType("exterior")}
            >
              <span>🌐 Exterior</span>
              <span>({totalExterior})</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= ÁREA DE ARRASTRE (CANVAS PAN & ZOOM) ================= */}
      <div
        className={`${styles.panGrabArea} ${isDragging ? styles.panGrabAreaDragging : ""}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className={styles.canvas}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: `${layout.totalWidth}px`,
            height: `${layout.totalHeight}px`,
          }}
        >
          {/* ================= 1. CAPA DE LÍNEAS SVG CON MARCADORES ================= */}
          <svg className={styles.svgLayer} width={layout.totalWidth} height={layout.totalHeight}>
            <defs>
              <marker
                id="arrow-blue"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
              </marker>

              <marker
                id="arrow-red"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
              </marker>
            </defs>

            {/* Capa de resplandor (Glow) bajo los conectores */}
            {layout.connections.map((conn) => (
              <path
                key={`glow-${conn.id}`}
                d={conn.pathD}
                className={`${styles.connectorGlow} ${conn.tieneAnomalia ? styles.connectorGlowAlert : ""}`}
              />
            ))}

            {/* Líneas de conexión */}
            {layout.connections.map((conn) => {
              const isTargetActive = activeItemId && (conn.childId === activeItemId || conn.parentId === activeItemId);
              const isTargetHovered =
                hoveredPasoId && (conn.childId === hoveredPasoId || conn.parentId === hoveredPasoId);
              const isConnHighlighted = isTargetActive || isTargetHovered;
              const isConnDimmed = (activeItemId && !isTargetActive) || (hoveredPasoId && !isTargetHovered);

              return (
                <path
                  key={conn.id}
                  d={conn.pathD}
                  className={`${styles.connectorLine} ${
                    conn.tieneAnomalia ? styles.connectorLineAlert : ""
                  } ${isConnHighlighted ? styles.connectorHighlighted : ""} ${
                    isConnDimmed ? styles.connectorDimmed : ""
                  }`}
                  markerEnd={conn.childId ? (conn.tieneAnomalia ? "url(#arrow-red)" : "url(#arrow-blue)") : undefined}
                />
              );
            })}

            {/* Puntos de unión (Junction dots) para bifurcaciones */}
            {layout.junctionDots.map((junc) => (
              <circle key={junc.id} cx={junc.x} cy={junc.y} r="4.5" className={styles.junctionDot} />
            ))}
          </svg>

          {/* ================= 2. CAPA DE NODOS HTML ================= */}
          <div className={styles.nodesLayer}>
            {/* 1. NODO RAÍZ: DOCUMENTO ORIGEN (Exactamente como la imagen cargada) */}
            <div
              className={styles.docOriginCard}
              style={{
                left: `${layout.rootNode.x}px`,
                top: `${layout.rootNode.y}px`,
                width: `${layout.rootNode.width}px`,
                height: `${layout.rootNode.height}px`,
              }}
              onDoubleClick={() => handleCenterNode(layout.rootNode)}
              title="Documento de Origen · Flujo inicial del expediente"
            >
              {/* Puerto de salida derecha hacia el paso 1 */}
              <div className={`${styles.cardPortRight} ${styles.cardPortOrigin}`} />

              {/* Banner superior con fondo de textura de archivo y badge INICIO */}
              <div className={styles.docOriginBanner}>
                <div className={styles.docOriginBannerLeft}>
                  <div className={styles.docOriginDocIcon}>📄</div>
                  <div className={styles.docOriginBannerTitles}>
                    <span className={styles.docOriginMainTitle}>DOCUMENTO ORIGEN</span>
                    <span className={styles.docOriginIdPill}>
                      ID: {info.id_documento || info.numero_doc || "-"}
                    </span>
                  </div>
                </div>
                <span className={styles.docOriginInicioPill}>INICIO</span>
              </div>

              {/* Cuerpo con fondo blanco y 6 tarjetas de metadatos */}
              <div className={styles.docOriginBody}>
                <div
                  className={styles.docOriginAsuntoBox}
                  title={info.asunto || "Sin asunto especificado"}
                >
                  <strong>ASUNTO: </strong>
                  {info.asunto || "-"}
                </div>

                <div className={styles.docOriginGrid}>
                  <div className={styles.docOriginPill}>
                    <span className={styles.docOriginPillLabel}>N° Documento</span>
                    <span className={styles.docOriginPillVal} title={info.numero_doc || "-"}>
                      {info.numero_doc || "-"}
                    </span>
                  </div>

                  <div className={styles.docOriginPill}>
                    <span className={styles.docOriginPillLabel}>Unidad Origen</span>
                    <span
                      className={styles.docOriginPillVal}
                      title={info.unidad_origen || info.oficina_inicial || pasos[0]?.oficina_origen || "-"}
                    >
                      {info.unidad_origen || info.oficina_inicial || pasos[0]?.oficina_origen || "-"}
                    </span>
                  </div>

                  <div className={styles.docOriginPill}>
                    <span className={styles.docOriginPillLabel}>Tipo Documento</span>
                    <span className={styles.docOriginPillVal}>{info.tipo_documento || "-"}</span>
                  </div>

                  <div className={styles.docOriginPill}>
                    <span className={styles.docOriginPillLabel}>Fecha Doc</span>
                    <span className={styles.docOriginPillVal}>
                      {info.fecha_doc ||
                        (pasos[0]?.fecha_creacion
                          ? pasos[0].fecha_creacion.split("T")[0].split(" ")[0]
                          : "-")}
                    </span>
                  </div>

                  <div className={styles.docOriginPill}>
                    <span className={styles.docOriginPillLabel}>Clasificación</span>
                    <span
                      className={`${styles.docOriginPillVal} ${
                        styles[
                          `clasif_${(
                            info.clasificacion
                              ? info.clasificacion.toLowerCase().includes("secreto")
                                ? "secreto"
                                : info.clasificacion.toLowerCase().includes("reservado")
                                ? "reservado"
                                : info.clasificacion.toLowerCase().includes("confidencial")
                                ? "confidencial"
                                : "comun"
                              : "comun"
                          )}`
                        ] || ""
                      }`}
                    >
                      {info.clasificacion || "-"}
                    </span>
                  </div>

                  <div className={styles.docOriginPill}>
                    <span className={styles.docOriginPillLabel}>Sistema de Envío</span>
                    <span className={styles.docOriginPillVal}>{info.sistema_envio || info.sistema || "-"}</span>
                  </div>
                </div>

                <div className={styles.docOriginFooter}>
                  <div className={styles.docOriginFlujoText}>
                    <span>🌱</span>
                    <span>Flujo inicia aquí</span>
                  </div>
                  <span className={styles.docOriginOrigenBadge}>
                    ORIGEN: {info.tipo_origen || (isExteriorPaso(pasos[0]) ? "EXTERNO" : "INSTITUCIONAL")}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. NODOS DE PASO: STEP FLOW CARDS (Idénticos a la imagen con oficina final) */}
            {layout.stepNodes.map((node) => {
              const p = node.item;
              const itemId = p.id_registro || p.paso;
              const isMatch = isNodeMatching(p);
              const isActive = activeItemId === itemId;
              const isHovered = hoveredPasoId === itemId;
              const hasChildren = !node.isTerminal;

              const senderUser = p.usuario || "Operador no asignado";
              const receiverUser =
                p.usuario_destino ||
                (p.estado === "PENDIENTE" ? "Por recepcionar" : p.usuario_receptor || "Destinatario");
              const receiverTime =
                p.fecha_recepcion
                  ? `${formatDateTime(p.fecha_recepcion).fecha} ${formatDateTime(p.fecha_recepcion).hora}`
                  : p.estado === "PENDIENTE"
                  ? "Pendiente"
                  : p.tiempo_transcurrido
                  ? `Δ ${p.tiempo_transcurrido}`
                  : p.fecha_creacion
                  ? `${formatDateTime(p.fecha_creacion).fecha} ${formatDateTime(p.fecha_creacion).hora}`
                  : "-";

              const isPendiente = p.estado?.toUpperCase().includes("PEND");
              const isFinalizado =
                p.estado?.toUpperCase().includes("FINAL") || p.estado?.toUpperCase().includes("RECEP");

              return (
                <div
                  key={node.id}
                  className={`${styles.stepFlowCard} ${
                    p.es_anomalo ? styles.stepFlowCardAnomalo : ""
                  } ${isActive ? styles.stepFlowCardActive : ""} ${!isMatch ? styles.nodeDimmed : ""}`}
                  style={{
                    left: `${node.x}px`,
                    top: `${node.y}px`,
                    width: `${node.width}px`,
                    height: `${node.height}px`,
                    transform: isHovered || isActive ? "scale(1.02) translateY(-2px)" : undefined,
                  }}
                  onMouseEnter={() => setHoveredPasoId(itemId)}
                  onMouseLeave={() => setHoveredPasoId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPaso(p);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleCenterNode(node);
                  }}
                  title={`Paso #${p.paso}: ${p.oficina_origen} ➔ ${p.oficina_destino} · Clic para inspección`}
                >
                  {/* Puerto de entrada izquierda */}
                  <div className={styles.cardPortLeft} />

                  {/* Puerto de salida derecha (si continúa el flujo) */}
                  {hasChildren && <div className={styles.cardPortRight} />}

                  {/* 1. Header con Icono de Oficina, Nombre y Badge */}
                  <div className={styles.stepCardHeader}>
                    <div className={styles.stepCardHeaderLeft}>
                      <div className={styles.stepCardIconBox}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 21h18M3 7v14M21 7v14M6 3h12v4H6zM9 11h2v2H9zM13 11h2v2h-2zM9 15h2v2H9zM13 15h2v2h-2z" />
                        </svg>
                      </div>
                      <div className={styles.stepCardTitleBox}>
                        <span className={styles.stepCardOfficeTitle} title={p.oficina_destino || p.oficina_origen}>
                          {p.oficina_destino || p.oficina_origen}
                        </span>
                        <span className={styles.stepCardSubTitle}>Paso #{p.paso}</span>
                      </div>
                    </div>

                    <div className={styles.stepCardBadgeBox}>
                      {p.es_bucle && (
                        <span className={styles.badgeBuclePill} title="Autoenvío o bucle detectado en la misma oficina">
                          🔄 BUCLE
                        </span>
                      )}
                      {p.es_anomalo ? (
                        <span className={styles.badgeAnomaloPill}>⚠️ ANOMALÍA</span>
                      ) : isPendiente ? (
                        <span className={styles.badgePendientePill}>PENDIENTE</span>
                      ) : isFinalizado ? (
                        <span className={styles.badgeFinalizadoPill}>FINALIZADO</span>
                      ) : (
                        <span className={styles.badgeDecretadoPill}>{p.estado || "DECRETADO"}</span>
                      )}
                    </div>
                  </div>

                  {/* 2. Routing Box (Origen oficina ➔ Destino oficina) */}
                  <div className={styles.stepRoutingBox}>
                    <div className={styles.stepRoutingItem}>
                      <span className={styles.stepRoutingLabel}>Origen oficina</span>
                      <div className={styles.stepRoutingValPill} title={p.oficina_origen}>
                        {p.oficina_origen || "-"}
                      </div>
                    </div>
                    <div className={styles.stepRoutingArrow}>➔</div>
                    <div className={styles.stepRoutingItem}>
                      <span className={styles.stepRoutingLabel}>Destino oficina</span>
                      <div className={styles.stepRoutingValPill} title={p.oficina_destino}>
                        {p.oficina_destino || "-"}
                      </div>
                    </div>
                  </div>

                  {/* 3. Personnel Box (Remitente y Receptor con Avatares) */}
                  <div className={styles.stepPersonnelBox}>
                    {/* Remitente */}
                    <div className={styles.stepPersonnelItem}>
                      <div className={styles.stepAvatarTarget} title="Remitente / Emisor">
                        🎖️
                      </div>
                      <div className={styles.stepPersonnelInfo}>
                        <span className={styles.stepPersonnelName} title={senderUser}>
                          {senderUser}
                        </span>
                        <span className={styles.stepPersonnelTime}>
                          {p.fecha_creacion
                            ? `${formatDateTime(p.fecha_creacion).fecha} ${formatDateTime(p.fecha_creacion).hora}`
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Receptor */}
                    <div className={styles.stepPersonnelItem}>
                      <div
                        className={p.estado === "PENDIENTE" ? styles.stepAvatar : styles.stepAvatarTarget}
                        title={p.estado === "PENDIENTE" ? "Recepción pendiente" : "Receptor"}
                      >
                        {p.estado === "PENDIENTE" ? "⏳" : "👤"}
                      </div>
                      <div className={styles.stepPersonnelInfo}>
                        <span className={styles.stepPersonnelName} title={receiverUser}>
                          {receiverUser}
                        </span>
                        <span className={styles.stepPersonnelTime}>{receiverTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Filas de Metadatos (Tags, Observación y Responsable - si existen) */}
                  {Boolean((p.acciones && p.acciones.length > 0) || p.observacion || p.decreto || p.proveido || p.responsable) && (
                    <div className={styles.stepMetaRow}>
                      {/* Tags */}
                      {p.acciones && p.acciones.length > 0 && (
                        <div className={styles.stepTagsRow}>
                          {p.acciones.slice(0, 2).map((act, i) => (
                            <span key={i} className={styles.miniTag}>
                              › {act}
                            </span>
                          ))}
                          {p.acciones.length > 2 && (
                            <span
                              className={styles.miniTag}
                              style={{ background: "#f1f5f9", color: "#64748b", borderColor: "#cbd5e1" }}
                            >
                              +{p.acciones.length - 2} más
                            </span>
                          )}
                        </div>
                      )}

                      {/* Observación / Decreto */}
                      {(p.observacion || p.decreto || p.proveido) && (
                        <div className={styles.stepObservacionRow}>
                          <span className={styles.stepObservacionLabel}>OBSERVACIÓN</span>
                          <div
                            className={styles.stepObservacionPill}
                            title={p.observacion || p.decreto || p.proveido}
                          >
                            <span>📜</span>
                            <span>{p.decreto ? `DECRETO ${p.decreto}` : p.observacion || p.proveido}</span>
                          </div>
                        </div>
                      )}

                      {/* Responsable */}
                      {(p.responsable || p.usuario_destino) && (
                        <div className={styles.stepResponsableRow}>
                          <span>Responsable:</span>
                          <strong title={p.responsable || p.usuario_destino}>
                            {p.responsable || p.usuario_destino}
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Footer con Botón Info e Indicador de Estado / Oficina Final */}
                  <div className={styles.stepCardFooter}>
                    <button
                      className={styles.infoBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPaso(p);
                      }}
                      title="Ver detalles de este movimiento"
                      type="button"
                    >
                      ⓘ
                    </button>

                    <div className={styles.stepCardFooterStatus}>
                      {node.isTerminal ? (
                        <span className={styles.finalOfficeBadge}>
                          <span>🏁</span>
                          <span>{isPendiente ? "OFICINA FINAL · PENDIENTE" : "OFICINA FINAL"}</span>
                        </span>
                      ) : (
                        <span className={styles.regularStatusText}>
                          {p.estado || "DECRETADO"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= TOOLBAR FLOTANTE DE ZOOM & CONTROLES ================= */}
      <div className={styles.controlsBar}>
        <button className={styles.controlBtn} onClick={handleZoomIn} title="Acercar (+ o =)" type="button">
          ➕
        </button>

        <span className={styles.zoomLabel} onClick={handleResetZoom} title="Restablecer zoom al 100%">
          {Math.round(zoom * 100)}%
        </span>

        <button className={styles.controlBtn} onClick={handleZoomOut} title="Alejar (-)" type="button">
          ➖
        </button>

        <div className={styles.divider} />

        <button
          className={styles.controlBtn}
          onClick={handleFitToView}
          title="Ajustar y centrar diagrama completo (Atajo: 0)"
          type="button"
        >
          🎯
        </button>

        <button
          className={styles.controlBtn}
          onClick={() => setIsFullscreen((prev) => !prev)}
          title={isFullscreen ? "Restaurar tamaño normal" : "Expandir pantalla completa"}
          type="button"
        >
          {isFullscreen ? "🗗" : "⛶"}
        </button>
      </div>

      {/* ================= MINIMAP (RADAR INTERACTIVO CLICK-TO-PAN) ================= */}
      <div
        className={styles.miniMapContainer}
        onClick={handleMinimapClick}
        title="Radar general: Haz clic para navegar directamente a esa posición"
      >
        <svg className={styles.miniMapSvg} viewBox={`0 0 ${miniWidth} ${miniHeight}`}>
          {/* Nodo Root */}
          <circle cx={layout.rootNode.x * miniScale} cy={layout.rootNode.centerY * miniScale} r="4.5" fill="#10b981" />

          {/* Nodos de Pasos */}
          {layout.stepNodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x * miniScale}
              cy={node.centerY * miniScale}
              r="3.5"
              fill={node.item.es_anomalo ? "#ef4444" : node.isTerminal ? "#d97706" : "#3b82f6"}
            />
          ))}

          {/* Recuadro del viewport activo */}
          <rect
            className={styles.miniMapViewportRect}
            x={viewportRectX}
            y={viewportRectY}
            width={viewportRectW}
            height={viewportRectH}
            rx="2"
          />
        </svg>
      </div>

      {/* ================= LEYENDA VISUAL INFERIOR ================= */}
      <div className={styles.legendBar}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.legendDotRoot}`} />
          <span>Doc. Origen</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.legendDotStep}`} />
          <span>Paso Intermedio</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.legendDotFinal}`} />
          <span>Oficina Final</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.legendDotAlert}`} />
          <span>Anomalía</span>
        </div>
      </div>

      {/* Hint flotante de ayuda */}
      {showHint && (
        <div className={styles.hintBar}>
          <span>💡</span>
          <span>Arrastra para mover el lienzo · Rueda para zoom · Doble clic para centrar nodo</span>
        </div>
      )}

      {/* ================= POPOVER DE DETALLE AL HACER CLIC EN UN NODO ================= */}
      {currentSelectedPaso && (
        <div className={styles.nodeDetailPopover}>
          <div className={styles.popoverHeader}>
            <h5 className={styles.popoverTitle}>
              <span>📋</span> Paso #{currentSelectedPaso.paso}
            </h5>
            <button className={styles.popoverClose} onClick={() => handleSelectPaso(null)} type="button">
              ✕
            </button>
          </div>

          <div className={styles.popoverGrid}>
            <div className={styles.popoverRow}>
              <span>Origen:</span>
              <strong>{currentSelectedPaso.oficina_origen}</strong>
            </div>
            <div className={styles.popoverRow}>
              <span>Destino:</span>
              <strong>{currentSelectedPaso.oficina_destino}</strong>
            </div>
            <div className={styles.popoverRow}>
              <span>Estado:</span>
              <strong>{currentSelectedPaso.estado}</strong>
            </div>
            <div className={styles.popoverRow}>
              <span>Usuario:</span>
              <strong>{currentSelectedPaso.usuario}</strong>
            </div>
            <div className={styles.popoverRow}>
              <span>Fecha:</span>
              <strong>
                {currentSelectedPaso.fecha_creacion
                  ? `${formatDateTime(currentSelectedPaso.fecha_creacion).fecha} ${formatDateTime(currentSelectedPaso.fecha_creacion).hora}`
                  : "-"}
              </strong>
            </div>
            {currentSelectedPaso.es_bucle && (
              <div className={styles.popoverRow} style={{ color: "#7c3aed" }}>
                <span>Alerta:</span>
                <strong>🔄 Bucle (Misma dependencia)</strong>
              </div>
            )}
            <div className={styles.popoverRow}>
              <span>Tiempo delta:</span>
              <strong>{currentSelectedPaso.tiempo_transcurrido || "-"}</strong>
            </div>

            <div className={styles.popoverScoreWrap}>
              <span style={{ color: "#64748b" }}>Score IF:</span>
              <strong
                style={{
                  color: currentSelectedPaso.es_anomalo ? "#dc2626" : "#059669",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                }}
              >
                {currentSelectedPaso.score != null ? currentSelectedPaso.score.toFixed(4) : "-"}
                {currentSelectedPaso.es_anomalo ? " (⚠️ Anómalo)" : " (Normal)"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
