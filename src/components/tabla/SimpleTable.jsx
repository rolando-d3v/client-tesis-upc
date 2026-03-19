import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { useMemo, useState } from "react";
import styles from "./tabla.module.css";

function SimpleTable({ datax, columns }) {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Pre-filter data by FECHA_DOC_D date range before passing to TanStack Table
  const filteredByDate = useMemo(() => {
    if (!fechaInicio && !fechaFin) return datax;

    return datax.filter((row) => {
      const fechaDoc = row.FECHA_DOC_D;
      if (!fechaDoc) return false;

      // Normalize: take only the date part (YYYY-MM-DD) for comparison
      const fechaDocDate = fechaDoc.substring(0, 10);

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



  // console.log(data.FECHA_DOC_D);
  

  const toggleRowExpand = (rowId) => {

    console.log(rowId);
    
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };


  // const data = useMemo(() => datax, [datax]);

  const table = useReactTable({
    data: filteredByDate,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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





  return (
    <div className={styles.tableContainer}>
      {/* ===== FILTER BAR ===== */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Fecha Inicio</label>
          <input
            type="date"
            className={styles.filterInput}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Fecha Final</label>
          <input
            type="date"
            className={styles.filterInput}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            min={fechaInicio || undefined}
          />
        </div>

        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar documentos remitidos..."
            value={filtering}
            onChange={(e) => setFiltering(e.target.value)}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
      </div>

      {/* ===== SCROLL HINT (visible on mobile/tablet) ===== */}
      <div className={styles.scrollHint}>
        <span className={styles.scrollHintIcon}>👆</span>
        Desliza horizontalmente · Toca <strong>⊕</strong> para ver detalle
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
        <table className={styles.table}>
          <thead className={styles.thead}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {/* Expand button column header — only visible on mobile */}
                <th className={styles.expandColHeader}></th>
                <th style={{ width: 50, textAlign: "center" }}>Nº</th>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className={styles.thContent}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className={styles.sortIndicator}>
                          {header.column.getIsSorted() === "asc"
                            ? "▲"
                            : header.column.getIsSorted() === "desc"
                            ? "▼"
                            : "⇅"}
                        </span>
                      </div>
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
                  <>
                    {/* Normal table row */}
                    <tr
                      key={row.id}
                      className={isExpanded ? styles.expandedParent : ""}
                    >
                      {/* Expand button cell */}
                      <td className={styles.expandCell}>
                        <button
                          className={`${styles.expandBtn} ${
                            isExpanded ? styles.expandBtnActive : ""
                          }`}
                          onClick={() => toggleRowExpand(row.id)}
                          title={isExpanded ? "Cerrar detalle" : "Ver detalle"}
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

                    {/* Expanded  card row (only visible when expanded) */}
                    {isExpanded && (
                      <tr key={`${row.id}-expanded`} className={styles.cardRow}>
                        <td colSpan={totalColumns}>
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
                        </td>
                      </tr>
                    )}
                  </>
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
            {currentPage * table.getState().pagination.pageSize + 1}
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

        <span className={styles.pageTotalLabel}>
          <span className={styles.filterLabel} style={{ marginLeft: 8 }}>
            De
          </span>{" "}
          <span style={{ fontWeight: 700, color: "#8b1a2b", fontSize: 13 }}>
            {totalPages}
          </span>
        </span>

        <select
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
