import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { useId, useMemo, useState, Fragment } from "react";
import { FaArrowsLeftRight, FaMagnifyingGlass, FaXmark } from "react-icons/fa6";
import styles from "./tabla.module.css";

function SimpleTable({ datax, columns, renderExpanded, toolbarSlot }) {
  const filterId = useId();
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Pre-filter data by FECHA_DOC_D date range before passing to TanStack Table
  const filteredByDate = useMemo(() => {
    if (!fechaInicio && !fechaFin) return datax;

    return datax.filter((row) => {
      const fechaDoc = row.FECHA_DOC_D || row.fecha_doc || row.fecha_creacion;
      if (!fechaDoc) return false;

      // Normalize: take only the date part (YYYY-MM-DD) for comparison
      const fechaDocStr = typeof fechaDoc === "string" ? fechaDoc : String(fechaDoc);
      const fechaDocDate = fechaDocStr.substring(0, 10);

      if (fechaInicio && fechaFin) {
        return fechaDocDate >= fechaInicio && fechaDocDate <= fechaFin;
      }
      if (fechaInicio) {
        return fechaDocDate >= fechaInicio;
      }
      if (fechaFin) {
        return fechaDocDate <= fechaFin;
      }
      return true;
    });
  }, [datax, fechaInicio, fechaFin]);

  const toggleRowExpand = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const table = useReactTable({
    data: filteredByDate,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row, index) => String(row.id_registro ?? index),
    state: {
      sorting,
      globalFilter: filtering,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
  });

  // Calculate visible pagination pages
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const paginationRange = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(0, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (range[0] > 0) {
      rangeWithDots.push(0);
      if (range[0] > 1) rangeWithDots.push("...");
    }

    rangeWithDots.push(...range);

    if (range[range.length - 1] < totalPages - 1) {
      if (range[range.length - 1] < totalPages - 2) rangeWithDots.push("...");
      rangeWithDots.push(totalPages - 1);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  const totalRows = table.getFilteredRowModel().rows.length;
  const totalColumns = columns.length + 2; // +1 for Nº, +1 for expand button
  const hasLocalFilters = Boolean(filtering || fechaInicio || fechaFin);
  const resetLocalFilters = () => {
    setFiltering("");
    setFechaInicio("");
    setFechaFin("");
  };

  return (
    <div className={styles.tableContainer}>
      {/* ===== TOOLBAR SLOT (Quick Filters, Tabs & Export) ===== */}
      {toolbarSlot && (
        <div className={styles.toolbarSlotWrapper}>
          {typeof toolbarSlot === "function"
            ? toolbarSlot({
                filteredData: table.getFilteredRowModel().rows.map((row) => row.original),
                hasLocalFilters,
                resetLocalFilters,
              })
            : toolbarSlot}
        </div>
      )}

      {/* ===== FILTER BAR ===== */}
      <div className={styles.filterBar}>
        <div className={styles.searchField}>
          <label className={styles.filterLabel} htmlFor={`${filterId}-search`}>Buscar registros</label>
          <div className={styles.searchWrapper}>
            <FaMagnifyingGlass className={styles.searchIcon} aria-hidden="true" />
            <input
              id={`${filterId}-search`}
              type="search"
              className={styles.searchInput}
              placeholder="Documento, usuario, oficina o motivo…"
              value={filtering}
              onChange={(e) => setFiltering(e.target.value)}
            />
            {filtering && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => setFiltering("")}
                aria-label="Limpiar búsqueda"
              >
                <FaXmark aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <label className={styles.filterGroup} htmlFor={`${filterId}-start`}>
          <span className={styles.filterLabel}>Desde</span>
          <input
            id={`${filterId}-start`}
            type="date"
            className={styles.filterInput}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            max={fechaFin || undefined}
          />
        </label>

        <label className={styles.filterGroup} htmlFor={`${filterId}-end`}>
          <span className={styles.filterLabel}>Hasta</span>
          <input
            id={`${filterId}-end`}
            type="date"
            className={styles.filterInput}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            min={fechaInicio || undefined}
          />
        </label>
      </div>

      {/* ===== SCROLL HINT (visible on mobile/tablet) ===== */}
      <div className={styles.scrollHint}>
        <FaArrowsLeftRight className={styles.scrollHintIcon} aria-hidden="true" />
        Desplaza la tabla para ver todas las columnas
      </div>

      {/* ===== RESULTS COUNT ===== */}
      {(filtering || fechaInicio || fechaFin) && (
        <div className={styles.resultsCount}>
          Se encontraron <span>{totalRows}</span> resultado
          {totalRows !== 1 ? "s" : ""}
          {(fechaInicio || fechaFin) && (
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
              {fechaInicio && fechaFin
                ? `(${fechaInicio} — ${fechaFin})`
                : fechaInicio
                ? `(desde ${fechaInicio})`
                : `(hasta ${fechaFin})`}
            </span>
          )}
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Registros de auditoría de anomalías">
          <thead className={styles.thead}  >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}   >
                <th className={styles.expandColHeader} scope="col">
                  <span className={styles.srOnly}>Detalle</span>
                </th>
                <th style={{ width: 50, textAlign: "center" }}>Nº</th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={header.column.getIsSorted() === "asc" ? "ascending" : header.column.getIsSorted() === "desc" ? "descending" : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={styles.thContent}
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && <span className={styles.sortIndicator} aria-hidden="true">
                          {header.column.getIsSorted() === "asc"
                            ? "▲"
                            : header.column.getIsSorted() === "desc"
                            ? "▼"
                            : "⇅"}
                        </span>}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className={styles.tbody}>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, rowIndex) => {
                // row.id es el id de la fila ojo
                const isExpanded = expandedRows[row.id];
                const rowNum =
                  currentPage * table.getState().pagination.pageSize +
                  rowIndex +
                  1;
                return (
                  <Fragment key={row.id}>
                    {/* Normal table row */}
                    <tr className={isExpanded ? styles.expandedParent : ""}>
                      {/* Expand button cell */}
                      <td className={styles.expandCell}>
                        <button
                          type="button"
                          className={`${styles.expandBtn} ${
                            isExpanded ? styles.expandBtnActive : ""
                          }`}
                          onClick={() => toggleRowExpand(row.id)}
                          title={isExpanded ? "Cerrar detalle" : "Ver detalle"}
                          aria-label={`${isExpanded ? "Cerrar" : "Ver"} detalle del registro ${rowNum}`}
                          aria-expanded={Boolean(isExpanded)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            className={
                              isExpanded ? styles.expandIconRotated : ""
                            }
                          >
                            <path
                              d="M7 1v12M1 7h12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </td>

                      <td className={styles.cellNumber}>{rowNum}</td>
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        )
                      })}
                    </tr>

                    {/* Expanded card row (only visible when expanded) */}
                    {isExpanded && (
                      <tr className={styles.cardRow}>
                        <td colSpan={totalColumns}>
                          {renderExpanded ? (
                            renderExpanded(
                              row.original,
                              () => toggleRowExpand(row.id),
                              rowNum
                            )
                          ) : (
                            <div className={styles.cardContent}>
                            <div className={styles.cardHeader}>
                              <span className={styles.cardHeaderNum}>
                                Registro #{rowNum}
                              </span>
                              <button
                                className={styles.cardCloseBtn}
                                onClick={() => toggleRowExpand(row.id)}
                              >
                                ✕
                              </button>
                            </div>
                            <div className={styles.cardBody}>
                              {row.getVisibleCells().map((cell) => (
                                <div
                                  key={cell.id}
                                  className={styles.cardField}
                                >
                                  <span className={styles.cardLabel}>
                                    {cell.column.columnDef.header}
                                  </span>
                                  <span className={styles.cardValue}>
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={totalColumns}
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📭</div>
                    <div className={styles.emptyText}>
                      No se encontraron registros
                    </div>
                    <div className={styles.emptySubtext}>
                      Intenta con otros filtros de búsqueda
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
      <div className={styles.pagination}>
        <div className={styles.paginationInfo}>
          Mostrando{" "}
          <span>
            {totalRows ? currentPage * table.getState().pagination.pageSize + 1 : 0}
          </span>{" "}
          -{" "}
          <span>
            {Math.min(
              (currentPage + 1) * table.getState().pagination.pageSize,
              totalRows
            )}
          </span>{" "}
          de <span>{totalRows}</span> registros
        </div>

        <div className={styles.paginationControls}>
          <button
            className={`${styles.pageBtn} ${styles.pageBtnNav}`}
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="Primera página"
          >
            «
          </button>
          <button
            className={`${styles.pageBtn} ${styles.pageBtnNav}`}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Página anterior"
          >
            ‹
          </button>

          {paginationRange.map((page, index) =>
            page === "..." ? (
              <span key={`dots-${index}`} className={styles.pageEllipsis}>
                ···
              </span>
            ) : (
              <button
                key={page}
                className={`${styles.pageBtn} ${
                  currentPage === page ? styles.pageBtnActive : ""
                }`}
                onClick={() => table.setPageIndex(page)}
                aria-label={`Página ${page + 1}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page + 1}
              </button>
            )
          )}

          <button
            className={`${styles.pageBtn} ${styles.pageBtnNav}`}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Página siguiente"
          >
            ›
          </button>
          <button
            className={`${styles.pageBtn} ${styles.pageBtnNav}`}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Última página"
          >
            »
          </button>
        </div>

        <select
          aria-label="Registros por página"
          className={styles.pageSizeSelect}
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} filas
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SimpleTable;
