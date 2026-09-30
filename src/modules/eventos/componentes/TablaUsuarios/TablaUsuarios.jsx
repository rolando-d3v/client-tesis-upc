import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./TablaUsuarios.module.css";
import TimelineUsuario from "../TimelineUsuario/TimelineUsuario";
import RoleBadge from "../../../../components/RoleBadge";
import { useD2UsuarioDetalle } from "../../../../api/apiEventos";

const NIVEL_EMOJI = { critico: "🔴", alto: "🟠", medio: "🟡", bajo: "🟢" };
const PAGE_SIZE = 10;

export default function TablaUsuarios({ usuarios = [] }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [filtroRol, setFiltroRol] = useState("");
  const detalleQuery = useD2UsuarioDetalle(selectedUser);

  const closeModal = useCallback(() => setSelectedUser(null), []);

  useEffect(() => {
    if (!selectedUser) return;
    const onKey = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedUser, closeModal]);

  // Lista de roles únicos presentes en los datos
  const availableRoles = useMemo(() => {
    const roles = new Set();
    usuarios.forEach((u) => {
      const r = u.rol || u.role || u.name_role;
      if (r) roles.add(r.trim());
    });
    return Array.from(roles).sort();
  }, [usuarios]);

  // Filtrado por rol
  const filteredUsuarios = useMemo(() => {
    if (!filtroRol) return usuarios;
    return usuarios.filter((u) => {
      const r = (u.rol || u.role || u.name_role || "").trim().toUpperCase();
      return r === filtroRol.trim().toUpperCase();
    });
  }, [usuarios, filtroRol]);

  const totalPages = Math.max(1, Math.ceil(filteredUsuarios.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filteredUsuarios.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredUsuarios, page]
  );

  useEffect(() => {
    setPage(1);
  }, [filtroRol]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const selectedUserObj = useMemo(
    () => (selectedUser ? usuarios.find((u) => u.user_id === selectedUser) : null),
    [selectedUser, usuarios]
  );
  const selectedNombre = selectedUserObj?.nombre || "";

  if (!usuarios || usuarios.length === 0) return <p className={styles.empty}>Sin datos de usuarios</p>;

  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <div className={styles.filterGroup}>
          <label htmlFor="filtro-rol-usuarios" style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
            Filtrar por Rol:
          </label>
          <select
            id="filtro-rol-usuarios"
            className={styles.roleSelect}
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="">Todos los roles ({usuarios.length})</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <span className={styles.tableCount}>
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
        </span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNum}>#</th>
              <th>Riesgo</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Oficina</th>
              <th>Eventos</th>
              <th>Secretos</th>
              <th>Descargas</th>
              <th>MB</th>
              <th>Fuera Hr</th>
              <th>Score</th>
              <th>Anómalos</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u, i) => (
              <tr key={u.user_id} className={selectedUser === u.user_id ? styles.rowSelected : ""}>
                <td className={styles.tdNum}>{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className={styles.td_item_riesgo}>
                  <div>
                    {NIVEL_EMOJI[u.nivel_riesgo]} {u.nivel_riesgo}
                  </div>
                </td>
                <td className={styles.nombre}>{u.nombre}</td>
                <td>
                  <RoleBadge role={u.rol || u.role || u.name_role} size="small" />
                </td>
                <td>{u.oficina}</td>
                <td className={styles.td_item}>{u.n_eventos?.toLocaleString()}</td>
                <td className={styles.td_item}>{u.n_docs_secreto}</td>
                <td className={styles.td_item}>{u.n_descargas}</td>
                <td className={styles.td_item}>{u.total_mb?.toFixed(1)}</td>
                <td className={styles.td_item}>{u.n_fuera_horario}</td>
                <td className={styles.score}>{u.score_riesgo?.toFixed(1)}</td>
                <td className={styles.td_item}>{u.n_anomalos}</td>
                <td>
                  <button
                    className={styles.btnDetalle}
                    onClick={() => setSelectedUser(u.user_id)}
                  >
                    🔍 Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹ Anterior
          </button>
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`${styles.pageNum} ${p === page ? styles.pageNumActive : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            className={styles.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Siguiente ›
          </button>
        </div>
      )}
      {selectedUser && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <span className={styles.modalTitle}>
                  📋 Timeline de usuario:{" "}
                  <span className={styles.modalTitleAccent}>{selectedNombre}</span>
                </span>
                <RoleBadge role={selectedUserObj?.rol || selectedUserObj?.role || selectedUserObj?.name_role} size="small" />
              </div>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {detalleQuery.isLoading ? (
                <p className={styles.loading}>Cargando timeline...</p>
              ) : (
                <TimelineUsuario data={detalleQuery.data || []} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
