import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import styles from "./ArbolTrazabilidad.module.css";

// Medidas y dimensiones base del layout
const ROOT_W = 240;
const ROOT_H = 72;
const L1_W = 250;
const L1_H = 62;
const L2_W = 280;
const L2_H = 56;

const GAP_X1 = 120;
const GAP_X2 = 120;
const ITEM_GAP_Y = 18;
const GROUP_GAP_Y = 38;
const PADDING_X = 60;
const PADDING_Y = 60;

export default function ArbolTrazabilidad({
  info = {},
  pasos = [],
  activePaso = null,
  onSelectPaso = null,
}) {
  const containerRef = useRef(null);
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
    [onSelectPaso]
  );

  // Auto-ocultar hint a los 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  // 1. Agrupar los pasos cronológicamente por oficina de origen
  const groups = useMemo(() => {
    if (!pasos || pasos.length === 0) return [];
    const map = new Map();

    pasos.forEach((p, idx) => {
      const officeKey = p.oficina_origen || "Oficina Inicial";
      if (!map.has(officeKey)) {
        map.set(officeKey, {
          id: `group-${idx}-${officeKey}`,
          oficina: officeKey,
          primerPaso: p.paso,
          tieneAnomalia: false,
          maxScore: 0,
          items: [],
        });
      }
      const g = map.get(officeKey);
      g.items.push(p);
      if (p.es_anomalo) g.tieneAnomalia = true;
      if (p.score > g.maxScore) g.maxScore = p.score;
    });

    return Array.from(map.values());
  }, [pasos]);

  // Conteos para filtros
  const totalAnomalias = useMemo(() => pasos.filter((p) => p.es_anomalo).length, [pasos]);
  const totalExterior = useMemo(() => pasos.filter((p) => p.es_exterior).length, [pasos]);

  // 2. Calcular coordenadas y layout geométrico del árbol
  const layout = useMemo(() => {
    if (groups.length === 0) return null;

    const x0 = PADDING_X;
    const x1 = x0 + ROOT_W + GAP_X1;
    const x2 = x1 + L1_W + GAP_X2;

    let currentY = PADDING_Y;
    const l1Nodes = [];
    const l2Nodes = [];
    const l1Connections = [];

    // Posicionar nodos de nivel 2 y agrupar para nivel 1
    groups.forEach((group) => {
      const itemCount = group.items.length;
      const groupHeight =
        itemCount * L2_H + (itemCount - 1) * ITEM_GAP_Y;
      const effectiveHeight = Math.max(groupHeight, L1_H);

      const groupL2Positions = [];

      group.items.forEach((item, j) => {
        const itemY = currentY + j * (L2_H + ITEM_GAP_Y);
        const l2Node = {
          item,
          x: x2,
          y: itemY,
          width: L2_W,
          height: L2_H,
          centerY: itemY + L2_H / 2,
        };
        groupL2Positions.push(l2Node);
        l2Nodes.push(l2Node);
      });

      // Centro vertical del nodo L1 = promedio del primer y último hijo L2
      const firstL2CenterY = groupL2Positions[0].centerY;
      const lastL2CenterY =
        groupL2Positions[groupL2Positions.length - 1].centerY;
      const l1CenterY = (firstL2CenterY + lastL2CenterY) / 2;
      const l1Y = l1CenterY - L1_H / 2;

      const l1Node = {
        group,
        x: x1,
        y: l1Y,
        width: L1_W,
        height: L1_H,
        centerY: l1CenterY,
        l2Nodes: groupL2Positions,
      };
      l1Nodes.push(l1Node);

      // Conectores entre L1 y cada L2 de este grupo
      const midX2 = x1 + L1_W + GAP_X2 / 2;
      let pathD = "";
      if (itemCount === 1) {
        // Línea recta directa
        pathD = `M ${x1 + L1_W} ${l1CenterY} H ${x2}`;
      } else {
        // Tronco + columna vertical + ramas horizontales
        pathD = `M ${x1 + L1_W} ${l1CenterY} H ${midX2} M ${midX2} ${firstL2CenterY} V ${lastL2CenterY} `;
        groupL2Positions.forEach((l2) => {
          pathD += `M ${midX2} ${l2.centerY} H ${x2} `;
        });
      }

      l1Connections.push({
        groupId: group.id,
        pathD,
        tieneAnomalia: group.tieneAnomalia,
        itemIds: group.items.map((i) => i.id_registro || i.paso),
      });

      currentY += effectiveHeight + GROUP_GAP_Y;
    });

    // 3. Posicionar el Root en base al centro de los nodos L1
    const firstL1CenterY = l1Nodes[0].centerY;
    const lastL1CenterY = l1Nodes[l1Nodes.length - 1].centerY;
    const rootCenterY = (firstL1CenterY + lastL1CenterY) / 2;
    const rootY = rootCenterY - ROOT_H / 2;

    const rootNode = {
      x: x0,
      y: rootY,
      width: ROOT_W,
      height: ROOT_H,
      centerY: rootCenterY,
    };

    // Conector del Root a los L1
    const midX1 = x0 + ROOT_W + GAP_X1 / 2;
    let rootPathD = "";
    if (l1Nodes.length === 1) {
      rootPathD = `M ${x0 + ROOT_W} ${rootCenterY} H ${x1}`;
    } else {
      rootPathD = `M ${x0 + ROOT_W} ${rootCenterY} H ${midX1} M ${midX1} ${firstL1CenterY} V ${lastL1CenterY} `;
      l1Nodes.forEach((l1) => {
        rootPathD += `M ${midX1} ${l1.centerY} H ${x1} `;
      });
    }

    const totalWidth = x2 + L2_W + PADDING_X * 2;
    const totalHeight = Math.max(currentY, rootY + ROOT_H) + PADDING_Y;

    return {
      rootNode,
      l1Nodes,
      l2Nodes,
      rootPathD,
      l1Connections,
      totalWidth,
      totalHeight,
    };
  }, [groups]);

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

  // Auto-ajuste inicial al montar
  useEffect(() => {
    if (layout) {
      handleFitToView();
    }
  }, [layout, handleFitToView]);

  // Centrar un nodo específico suavemente en pantalla
  const handleCenterNode = useCallback((node) => {
    if (!containerRef.current || !node) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const targetZoom = Math.max(zoom, 1.0);
    const targetPanX = cw / 2 - (node.x + node.width / 2) * targetZoom;
    const targetPanY = ch / 2 - (node.y + node.height / 2) * targetZoom;

    setZoom(targetZoom);
    setPan({ x: Math.round(targetPanX), y: Math.round(targetPanY) });
  }, [zoom]);

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
  const isNodeMatching = useCallback((item) => {
    if (!item) return true;

    // Filtro por tipo
    if (filterType === "anomalias" && !item.es_anomalo) return false;
    if (filterType === "exterior" && !item.es_exterior) return false;

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
  }, [filterType, searchQuery]);

  const isGroupMatching = useCallback((group) => {
    return group.items.some((i) => isNodeMatching(i));
  }, [isNodeMatching]);

  // Minimap calculations & click-to-pan
  const miniWidth = 150;
  const miniHeight = 95;
  const miniScale = layout
    ? Math.min(miniWidth / layout.totalWidth, miniHeight / layout.totalHeight)
    : 0.1;
  const containerCw = containerRef.current?.clientWidth || 800;
  const containerCh = containerRef.current?.clientHeight || 600;
  const viewportRectX = layout ? Math.max(0, -pan.x / zoom) * miniScale : 0;
  const viewportRectY = layout ? Math.max(0, -pan.y / zoom) * miniScale : 0;
  const viewportRectW = layout
    ? Math.min(layout.totalWidth, containerCw / zoom) * miniScale
    : 0;
  const viewportRectH = layout
    ? Math.min(layout.totalHeight, containerCh / zoom) * miniScale
    : 0;

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
        <p style={{ color: "#64748b" }}>Cargando diagrama de trazabilidad...</p>
      </div>
    );
  }

  // Comprobar si un nodo está seleccionado activamente
  const activeItemId = currentSelectedPaso?.id_registro || currentSelectedPaso?.paso;

  return (
    <div
      ref={containerRef}
      className={`${styles.viewportContainer} ${
        isFullscreen ? styles.viewportContainerFullscreen : ""
      }`}
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
            className={`${styles.filterChip} ${
              filterType === "anomalias" ? styles.filterChipActiveAlert : ""
            }`}
            onClick={() => setFilterType("anomalias")}
          >
            <span>⚠️ Anomalías</span>
            <span>({totalAnomalias})</span>
          </button>

          {totalExterior > 0 && (
            <button
              type="button"
              className={`${styles.filterChip} ${
                filterType === "exterior" ? styles.filterChipActive : ""
              }`}
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
        className={`${styles.panGrabArea} ${
          isDragging ? styles.panGrabAreaDragging : ""
        }`}
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
          <svg
            className={styles.svgLayer}
            width={layout.totalWidth}
            height={layout.totalHeight}
          >
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
            <path
              d={layout.rootPathD}
              className={styles.connectorGlow}
            />
            {layout.l1Connections.map((conn) => (
              <path
                key={`glow-${conn.groupId}`}
                d={conn.pathD}
                className={`${styles.connectorGlow} ${
                  conn.tieneAnomalia ? styles.connectorGlowAlert : ""
                }`}
              />
            ))}

            {/* Conector principal Root -> Nivel 1 */}
            <path
              d={layout.rootPathD}
              className={styles.connectorLine}
              markerEnd="url(#arrow-blue)"
            />

            {/* Conectores Nivel 1 -> Nivel 2 */}
            {layout.l1Connections.map((conn) => {
              const isTargetActive =
                activeItemId && conn.itemIds.includes(activeItemId);
              const isTargetHovered =
                hoveredPasoId && conn.itemIds.includes(hoveredPasoId);
              const isConnHighlighted = isTargetActive || isTargetHovered;
              const isConnDimmed =
                (activeItemId && !isTargetActive) ||
                (hoveredPasoId && !isTargetHovered);

              return (
                <path
                  key={conn.groupId}
                  d={conn.pathD}
                  className={`${styles.connectorLine} ${
                    conn.tieneAnomalia ? styles.connectorLineAlert : ""
                  } ${isConnHighlighted ? styles.connectorHighlighted : ""} ${
                    isConnDimmed ? styles.connectorDimmed : ""
                  }`}
                  markerEnd={conn.tieneAnomalia ? "url(#arrow-red)" : "url(#arrow-blue)"}
                />
              );
            })}
          </svg>

          {/* ================= 2. CAPA DE NODOS HTML ================= */}
          <div className={styles.nodesLayer}>
            {/* NODO RAÍZ (ROOT PILL — ROJO/MAGENTA) */}
            <div
              className={styles.nodeRoot}
              style={{
                left: `${layout.rootNode.x}px`,
                top: `${layout.rootNode.y}px`,
                width: `${layout.rootNode.width}px`,
                height: `${layout.rootNode.height}px`,
              }}
              onDoubleClick={() => handleCenterNode(layout.rootNode)}
              title="Doble clic para centrar en pantalla"
            >
              <div className={styles.nodeRootIcon}>📄</div>
              <div className={styles.nodeRootInfo}>
                <div className={styles.nodeRootTitle}>
                  Doc. #{info.numero_doc || info.id_documento}
                </div>
                <div className={styles.nodeRootSub}>
                  <span>{info.tipo_documento || "DOC"}</span>
                  <span className={styles.badgeRootClasif}>
                    {info.clasificacion || "COMUN"}
                  </span>
                </div>
              </div>
            </div>

            {/* NODOS DE NIVEL 1 (AZUL SÓLIDO — OFICINAS ORIGEN) */}
            {layout.l1Nodes.map((l1) => {
              const groupMatches = isGroupMatching(l1.group);
              const isChildActive =
                activeItemId &&
                l1.group.items.some(
                  (i) => (i.id_registro || i.paso) === activeItemId
                );
              const isChildHovered =
                hoveredPasoId &&
                l1.group.items.some(
                  (i) => (i.id_registro || i.paso) === hoveredPasoId
                );
              const isHighlighted = isChildActive || isChildHovered;

              return (
                <div
                  key={l1.group.id}
                  className={`${styles.nodeLevel1} ${
                    l1.group.tieneAnomalia ? styles.nodeLevel1Alert : ""
                  } ${!groupMatches ? styles.nodeDimmed : ""}`}
                  style={{
                    left: `${l1.x}px`,
                    top: `${l1.y}px`,
                    width: `${l1.width}px`,
                    height: `${l1.height}px`,
                    transform: isHighlighted ? "scale(1.04)" : undefined,
                    boxShadow: isHighlighted
                      ? "0 0 0 3px #60a5fa, 0 12px 28px rgba(37, 99, 235, 0.5)"
                      : undefined,
                  }}
                  onDoubleClick={() => handleCenterNode(l1)}
                  title={`Oficina Emisora: ${l1.group.oficina} (${l1.group.items.length} derivaciones) · Doble clic para centrar`}
                >
                  <div className={styles.nodeLevel1Icon}>🏢</div>
                  <div className={styles.nodeLevel1Text}>
                    <div className={styles.nodeLevel1Title}>
                      {l1.group.oficina}
                    </div>
                    <div className={styles.nodeLevel1Sub}>
                      {l1.group.items.length} derivaci
                      {l1.group.items.length === 1 ? "ón" : "ones"}
                      {l1.group.tieneAnomalia && " ⚠️"}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* NODOS DE NIVEL 2 (BLANCOS CON BORDE — PASOS/DESTINOS) */}
            {layout.l2Nodes.map((l2, idx) => {
              const p = l2.item;
              const itemId = p.id_registro || p.paso;
              const isMatch = isNodeMatching(p);
              const isActive = activeItemId === itemId;
              const isHovered = hoveredPasoId === itemId;

              return (
                <div
                  key={itemId || idx}
                  className={`${styles.nodeLevel2} ${
                    p.es_anomalo ? styles.nodeLevel2Anomalo : ""
                  } ${isActive ? styles.nodeLevel2Active : ""} ${
                    !isMatch ? styles.nodeDimmed : ""
                  }`}
                  style={{
                    left: `${l2.x}px`,
                    top: `${l2.y}px`,
                    width: `${l2.width}px`,
                    height: `${l2.height}px`,
                    transform: isHovered || isActive ? "scale(1.04) translateX(4px)" : undefined,
                  }}
                  onMouseEnter={() => setHoveredPasoId(itemId)}
                  onMouseLeave={() => setHoveredPasoId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPaso(p);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleCenterNode(l2);
                  }}
                  title={`Paso #${p.paso}: ${p.oficina_origen} ➔ ${p.oficina_destino} · Clic para inspección`}
                >
                  <div className={styles.nodeLevel2Left}>
                    <span className={styles.stepIndexBadge}>#{p.paso}</span>
                    <div className={styles.nodeLevel2Content}>
                      <div className={styles.nodeLevel2Dest}>
                        ➔ {p.oficina_destino}
                      </div>
                      <div className={styles.nodeLevel2Meta}>
                        <span className={styles.metaState}>{p.estado}</span>
                        <span>·</span>
                        <span>{p.usuario}</span>
                        {p.es_bucle && <span>🔁</span>}
                        {p.es_exterior && <span>🌐</span>}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`${styles.nodeLevel2Badge} ${
                      p.es_anomalo ? styles.badgeCritical : styles.badgeNormal
                    }`}
                  >
                    {p.es_anomalo ? `⚠️ ${p.score.toFixed(3)}` : `✓ OK`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= TOOLBAR FLOTANTE DE ZOOM & CONTROLES ================= */}
      <div className={styles.controlsBar}>
        <button
          className={styles.controlBtn}
          onClick={handleZoomIn}
          title="Acercar (+ o =)"
          type="button"
        >
          ➕
        </button>

        <span
          className={styles.zoomLabel}
          onClick={handleResetZoom}
          title="Restablecer zoom al 100%"
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          className={styles.controlBtn}
          onClick={handleZoomOut}
          title="Alejar (-)"
          type="button"
        >
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
          <circle
            cx={layout.rootNode.x * miniScale}
            cy={layout.rootNode.centerY * miniScale}
            r="4.5"
            fill="#e11d48"
          />

          {/* Nodos L1 */}
          {layout.l1Nodes.map((l1, i) => (
            <circle
              key={i}
              cx={l1.x * miniScale}
              cy={l1.centerY * miniScale}
              r="3.5"
              fill={l1.group.tieneAnomalia ? "#ef4444" : "#2563eb"}
            />
          ))}

          {/* Nodos L2 */}
          {layout.l2Nodes.map((l2, i) => (
            <circle
              key={i}
              cx={l2.x * miniScale}
              cy={l2.centerY * miniScale}
              r="2.5"
              fill={l2.item.es_anomalo ? "#ef4444" : "#94a3b8"}
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
          <span>Doc. Raíz</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.legendDotL1}`} />
          <span>Oficina Origen</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.legendDotL2}`} />
          <span>Destino Normal</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.legendDotAlert}`} />
          <span>Anomalía Detectada</span>
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
            <button
              className={styles.popoverClose}
              onClick={() => handleSelectPaso(null)}
              type="button"
            >
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
              <strong>{currentSelectedPaso.fecha_creacion}</strong>
            </div>
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
                {currentSelectedPaso.score != null
                  ? currentSelectedPaso.score.toFixed(4)
                  : "-"}
                {currentSelectedPaso.es_anomalo ? " (⚠️ Anómalo)" : " (Normal)"}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
