import SimpleTable from "./SimpleTable";
import { useDetalleAnomalias } from "../../../../api/apiAnomalias";
import { useSelector } from "react-redux";
import { useMemo } from "react";

function getBadgeClass(clasificacion) {
  const c = clasificacion?.toLowerCase();
  if (c === "secreto") return "badge badge-secreto";
  if (c === "reservado") return "badge badge-reservado";
  if (c === "confidencial") return "badge badge-confidencial";
  return "badge badge-comun";
}

function getScoreClass(score) {
  if (score < -0.05) return "score-cell critical";
  if (score < -0.02) return "score-cell warning";
  return "score-cell low";
}

function TableAnomalias() {
  // Filtro global de fechas desde Redux
  const { fechaInicio, fechaFin } = useSelector((state) => state.FILTRO_FECHAS);

  // Consultar un límite alto para poder buscar/ordenar/paginar en cliente de forma fluida
  const { data: result, isLoading: loading } = useDetalleAnomalias(1, 1000, {
    fechaInicio,
    fechaFin,
  });

  console.log("result", result);

  const datax = result?.data || [];

  const columns = useMemo(
    () => [
      {
        header: "ID Registro",
        accessorKey: "id_registro",
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
    </div>
  );
}

export default TableAnomalias;
