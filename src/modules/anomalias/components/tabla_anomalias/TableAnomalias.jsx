import SimpleTable from "./SimpleTable";
import { useDetalleAnomalias } from "../../../../api/apiAnomalias";
import { useSelector } from "react-redux";
import { useMemo, useState } from "react";
import ModalTrazabilidad from "../modal_trazabilidad/ModalTrazabilidad";
import styles from "./TableAnomalias.module.css";

function getBadgeClass(clasificacion) {
  const c = clasificacion?.toLowerCase();
  if (c === "secreto") return "badge badge-secreto";
  if (c === "reservado") return "badge badge-reservado";
  if (c === "confidencial") return "badge badge-confidencial";
  return "badge badge-comun";
}

function getScoreClass(score) {
  const num = Number(score);
  if (isNaN(num)) return "score-cell low";
  // Escala normalizada [0, 1] (0 = Normal, 1 = Máx. Anomalía)
  if (num >= 0 && num <= 1.05) {
    if (num >= 0.85) return "score-cell critical";
    if (num >= 0.70) return "score-cell warning";
    return "score-cell low";
  }
  // Retrocompatibilidad con scores raw negativos de Isolation Forest
  if (num < -0.05) return "score-cell critical";
  if (num < -0.02) return "score-cell warning";
  return "score-cell low";
}

function TableAnomalias() {
  // Filtro global de fechas desde Redux
  const { fechaInicio, fechaFin } = useSelector((state) => state.FILTRO_FECHAS);

  // Estado para modal de trazabilidad { id, num }
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Consultar un límite alto para poder buscar/ordenar/paginar en cliente de forma fluida
  const { data: result, isLoading: loading } = useDetalleAnomalias(1, 1000, {
    fechaInicio,
    fechaFin,
  });

  const datax = result?.data || [];

  const columns = useMemo(
    () => [
      {
        header: "ID Registro",
        accessorKey: "id_registro",
      },
      {
        header: "N° Documento",
        accessorKey: "numero_doc",
        cell: (info) => {
          const numDoc = info.getValue();
          const idDoc = info.row.original.id_documento;
          return (
            <div
              className={styles.docCell}
              onClick={() => {
                if (idDoc) {
                  setSelectedDoc({ id: idDoc, num: numDoc });
                }
              }}
              title={idDoc ? "Clic para ver trazabilidad del documento" : ""}
            >
              <span className={styles.docNum}>{numDoc ? `#${numDoc}` : "-"}</span>
              <span className={styles.docId}>ID: {idDoc || "-"}</span>
            </div>
          );
        },
      },
      {
        header: "Trazabilidad",
        id: "ver_trazabilidad",
        cell: ({ row }) => {
          const idDoc = row.original.id_documento;
          const numDoc = row.original.numero_doc;
          return (
            <button
              type="button"
              className={styles.btnTrazabilidad}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDoc({ id: idDoc, num: numDoc });
              }}
              disabled={!idDoc}
              title={
                idDoc
                  ? `Ver trazabilidad completa del documento #${numDoc || idDoc}`
                  : "Sin ID de documento"
              }
            >
              <span className={styles.btnIcon}>🗺️</span>
              <span className={styles.btnText}>Ver Flujo</span>
            </button>
          );
        },
      },
      {
        header: "Usuario",
        accessorKey: "usuario",
      },
      {
        header: "Oficina Origen",
        accessorKey: "oficina_origen",
      },
      {
        header: "Oficina Destino",
        accessorKey: "oficina_destino",
      },
      {
        header: "Clasif.",
        accessorKey: "clasificacion",
        cell: (info) => (
          <span
            className={getBadgeClass(info.getValue())}
            style={{ fontSize: 12 }}
          >
            {info.getValue()}
          </span>
        ),
      },
      {
        header: "Peso (MB)",
        accessorKey: "peso_mb",
        cell: (info) => {
          const val = info.getValue();
          return val != null ? `${val.toFixed(2)} MB` : "-";
        },
      },
      {
        header: "Estado",
        accessorKey: "estado",
        cell: (info) => {
          const val = info.getValue();
          return <span style={{ fontSize: 12 }}>{val}</span>;
        },
      },
      {
        header: "Tipo Doc.",
        accessorKey: "tipo_documento",
      },
      {
        header: "Destino",
        accessorKey: "destino",
      },
      {
        header: "Score",
        accessorKey: "score",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className={getScoreClass(val)} style={{ fontSize: 14 }}>
              {val != null ? val.toFixed(4) : "-"}
            </span>
          );
        },
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Cargando registros con react-table...</p>
      </div>
    );
  }

  if (datax.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>
          No hay anomalías registradas aún. Sube un archivo CSV desde el
          Dashboard para iniciar el análisis.
        </p>
      </div>
    );
  }

  return (
    <div>
      <SimpleTable datax={datax} columns={columns} />

      {selectedDoc && (
        <ModalTrazabilidad
          idDocumento={selectedDoc.id}
          numeroDoc={selectedDoc.num}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  );
}

export default TableAnomalias;
