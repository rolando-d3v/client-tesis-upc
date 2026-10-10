import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./RadarRiesgo.module.css";
import RoleBadge from "../../../../components/RoleBadge";
import { FaMagnifyingGlass, FaXmark, FaCheck, FaChevronDown, FaUsers } from "react-icons/fa6";
import { toast } from "sonner";

const MAX_SELECTION = 3;
const COLORES = ["#2563eb", "#7c3aed", "#0891b2"];

export default function RadarRiesgo({ usuarios = [], activeUserId = null }) {
  const activeUser = activeUserId == null ? null : usuarios.find(
    (u) => u.user_id === activeUserId || u.id === activeUserId || u.nombre === activeUserId
  );
  const activeId = activeUser ? activeUser.user_id ?? activeUser.nombre : null;
  const [previousActiveId, setPreviousActiveId] = useState(activeId);
  const [selectedUserIds, setSelectedUserIds] = useState(() => {
    if (activeUserId != null && usuarios.length > 0) {
      const found = usuarios.find(
        (u) => u.user_id === activeUserId || u.id === activeUserId || u.nombre === activeUserId
      );
      if (found) return [found.user_id ?? found.nombre];
    }
    return usuarios.length > 0 ? [usuarios[0].user_id ?? usuarios[0].nombre] : [];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Ajustar la selección solo cuando cambia la identidad recibida.
  if (previousActiveId !== activeId) {
    setPreviousActiveId(activeId);
    if (activeId != null) {
      setSelectedUserIds((prev) => prev.includes(activeId)
        ? prev
        : [activeId, ...prev].slice(0, MAX_SELECTION));
    }
  }

  // Manejo de clic exterior para cerrar el dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalización sin acentos para búsqueda insensible a tildes (ej: "Perez" encuentra "Pérez")
  const normalize = (str) =>
    (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // Filtrado dinámico en tiempo real sobre la totalidad de usuarios (75+)
  const filteredUsuarios = useMemo(() => {
    if (!searchQuery.trim()) return usuarios;
    const q = normalize(searchQuery);
    return usuarios.filter((u) => {
      const nombre = normalize(u.nombre);
      const rol = normalize(u.rol || u.role);
      const oficina = normalize(u.oficina);
      const id = normalize(u.user_id || u.id);
      return (
        nombre.includes(q) ||
        rol.includes(q) ||
        oficina.includes(q) ||
        id.includes(q)
      );
    });
  }, [usuarios, searchQuery]);

  // Objetos de usuarios actualmente seleccionados
  const selectedUserObjects = useMemo(() => {
    return selectedUserIds
      .map((id) => usuarios.find((u) => (u.user_id ?? u.nombre) === id))
      .filter(Boolean);
  }, [selectedUserIds, usuarios]);

  const handleToggleUser = (user) => {
    const id = user.user_id ?? user.nombre;
    setSelectedUserIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          toast.info("Debe haber al menos 1 usuario seleccionado para visualizar el radar.");
          return prev;
        }
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= MAX_SELECTION) {
        toast.warning(`Máximo ${MAX_SELECTION} usuarios para comparación simultánea.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleRemoveUser = (id, e) => {
    e.stopPropagation();
    setSelectedUserIds((prev) => {
      if (prev.length <= 1) {
        toast.info("Debe haber al menos 1 usuario seleccionado.");
        return prev;
      }
      return prev.filter((item) => item !== id);
    });
  };

  if (!usuarios || usuarios.length === 0) return <p className={styles.empty}>Sin datos</p>;

  const dimensiones = ["horario", "volumen", "clasificacion", "cambio_comportamiento", "acciones_criticas", "score_if", "score_lstm", "score_final"];
  const labels = {
    horario: "Horario",
    volumen: "Volumen",
    clasificacion: "Clasificación",
    cambio_comportamiento: "Cambio de conducta",
    acciones_criticas: "Acciones Críticas",
    score_if: "Isolation Forest · 40%",
    score_lstm: "LSTM Autoencoder · 60%",
    score_final: "Ensemble final",
  };

  const radarData = dimensiones.map((dim) => {
    const item = { dimension: labels[dim] };
    selectedUserObjects.forEach((u) => {
      item[u.nombre] = u[dim] || 0;
    });
    return item;
  });

  return (
    <div className={styles.container}>
      {/* Selector Multi-Select Profesional */}
      <div className={styles.multiSelectSection} ref={dropdownRef}>
        <div className={styles.selectHeaderRow}>
          <div className={styles.selectLabel}>
            <FaUsers aria-hidden="true" /> Comparativa de perfiles
            <span className={styles.badgeCounter}>
              {selectedUserIds.length}/{MAX_SELECTION} seleccionados
            </span>
          </div>
          {selectedUserIds.length >= MAX_SELECTION && (
            <span className={styles.limitReachedNotice}>
              Máximo {MAX_SELECTION} usuarios alcanzado
            </span>
          )}
        </div>

        {/* Input Trigger con Chips */}
        <div
          className={`${styles.selectTrigger} ${isOpen ? styles.selectTriggerOpen : ""}`}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <div className={styles.selectedChipsContainer}>
            {selectedUserObjects.map((u, idx) => {
              const color = COLORES[idx % COLORES.length];
              return (
                <span
                  key={u.user_id ?? u.nombre}
                  className={styles.userChip}
                  style={{ borderColor: color }}
                >
                  <span className={styles.chipColorDot} style={{ backgroundColor: color }} />
                  <span className={styles.chipName}>{u.nombre}</span>
                  <RoleBadge role={u.rol || u.role} size="small" showIcon={false} />
                  <span className={styles.chipScore} style={{ color }}>
                    ({u.score_riesgo?.toFixed(0) ?? 0})
                  </span>
                  <button
                    type="button"
                    className={styles.chipRemoveBtn}
                    onClick={(e) => handleRemoveUser(u.user_id ?? u.nombre, e)}
                    aria-label={`Quitar a ${u.nombre} de la comparativa`}
                    title={`Quitar ${u.nombre}`}
                  >
                    <FaXmark />
                  </button>
                </span>
              );
            })}

            <div className={styles.searchInputWrapper} onClick={(e) => e.stopPropagation()}>
              <FaMagnifyingGlass className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                aria-label="Buscar usuario por nombre, rol, oficina o identificador"
                placeholder={
                  selectedUserIds.length >= MAX_SELECTION
                    ? `Límite alcanzado (${MAX_SELECTION}/${MAX_SELECTION})...`
                    : "Buscar usuario por nombre o rol..."
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchQuery("")}
                  title="Limpiar búsqueda"
                >
                  <FaXmark />
                </button>
              )}
            </div>
          </div>

          <div className={styles.triggerRightIcons}>
            <FaChevronDown
              className={`${styles.chevronIcon} ${isOpen ? styles.chevronIconOpen : ""}`}
            />
          </div>
        </div>

        {/* Dropdown flotante con lista filtrada */}
        {isOpen && (
          <div className={styles.dropdownMenu}>
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>
                Usuarios ({filteredUsuarios.length})
              </span>
              <span className={styles.dropdownHint}>
                Selecciona hasta {MAX_SELECTION} para proyectar en el radar
              </span>
            </div>

            <div className={styles.dropdownList} role="group" aria-label="Resultados de usuarios">
              {filteredUsuarios.length === 0 ? (
                <div className={styles.dropdownEmpty}>
                  <FaMagnifyingGlass aria-hidden="true" />
                  <p>No se encontraron usuarios con &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                filteredUsuarios.map((u) => {
                  const id = u.user_id ?? u.nombre;
                  const isSelected = selectedUserIds.includes(id);
                  const selectIndex = selectedUserIds.indexOf(id);
                  const color = isSelected ? COLORES[selectIndex % COLORES.length] : undefined;
                  const isMaxReached = !isSelected && selectedUserIds.length >= MAX_SELECTION;

                  return (
                    <button
                      type="button"
                      key={id}
                      className={`${styles.dropdownItem} ${isSelected ? styles.dropdownItemSelected : ""} ${isMaxReached ? styles.dropdownItemDisabled : ""}`}
                      onClick={() => !isMaxReached && handleToggleUser(u)}
                      disabled={isMaxReached}
                      aria-pressed={isSelected}
                      style={isSelected ? { borderColor: color, backgroundColor: `${color}10` } : {}}
                    >
                      <div className={styles.itemLeft}>
                        <div
                          className={`${styles.itemCheckbox} ${isSelected ? styles.itemCheckboxChecked : ""}`}
                          style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
                        >
                          {isSelected && <FaCheck className={styles.checkIcon} />}
                        </div>

                        <div
                          className={styles.itemAvatar}
                          style={isSelected ? { borderColor: color } : {}}
                        >
                          {u.nombre ? u.nombre.charAt(0).toUpperCase() : "U"}
                        </div>

                        <div className={styles.itemInfo}>
                          <div className={styles.itemTopRow}>
                            <span className={styles.itemNombre}>{u.nombre}</span>
                            <RoleBadge role={u.rol || u.role} size="small" />
                          </div>
                          {u.oficina && (
                            <span className={styles.itemOficina}>{u.oficina}</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.itemRight}>
                        <div
                          className={styles.riskBadge}
                          data-risk={u.nivel_riesgo || "bajo"}
                        >
                          <span className={styles.riskDot} />
                          <span className={styles.riskText}>
                            Score: {u.score_riesgo?.toFixed(0) ?? 0}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className={styles.dropdownFooter}>
              <span>Cada perfil seleccionado se muestra como una serie independiente en el radar.</span>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico Radar de Riesgo */}
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={radarData} outerRadius="72%" margin={{ top: 8, right: 26, bottom: 8, left: 26 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: "#475569", fontSize: 10, fontWeight: 550 }} />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fill: "#94a3b8", fontSize: 9 }}
            axisLine={false}
          />
          {selectedUserObjects.map((u, i) => {
            const color = COLORES[i % COLORES.length];
            return (
              <Radar
                key={u.user_id ?? u.nombre}
                name={u.nombre}
                dataKey={u.nombre}
                stroke={color}
                fill={color}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={{ r: 2.5, strokeWidth: 0 }}
              />
            );
          })}
          <Tooltip
            contentStyle={{
              background: "rgba(255, 255, 255, 0.96)",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              color: "#1e293b",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12)",
              fontSize: "0.78rem",
            }}
            formatter={(value) => [`${Number(value).toFixed(0)} / 100`, "Índice"]}
          />
          <Legend
            verticalAlign="bottom"
            height={34}
            wrapperStyle={{ fontSize: 11, color: "#334155", paddingTop: "0.25rem" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
