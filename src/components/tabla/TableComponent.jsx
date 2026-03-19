import SimpleTable from "./SimpleTable";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

function TableComponent() {


  const [datax, setDatax] = useState([])

  const columns = [
    // {
    //   header: "ID",
    //   accessorKey: "ID_DOCUMENTO_I",
    //   footer: "Mi ID",
    // },

    {
      header: "Tipo D.",
      accessorKey: "OBJ_TIPO_DOCUMENTO.DESC_CORTA_V",
      // cell: (info) => <span>{info.getValue()}</span>,
      footer: "Mi pais",
    },
    {
      header: "N° doc",
      accessorKey: "NUMERO_V",
      // cell: (info) => <span>{info.getValue()}</span>,
      footer: "Mi pais",
    },
    {
        header: 'Asunto',
       accessorFn: row => `${row.ASUNTO_T}`
    },
    // {
    //   header: "Nombres Completos",
    //   columns: [
    //     {
    //       header: "Nombres",
    //       accessorKey: "ASUNTO_T",
    //       footer: "Mi nombre",
    //     },
    //     {
    //       header: "Apellido",
    //       accessorKey: "lastname",
    //       footer: "Mi apellido",
    //     },
    //   ],
    // },
    {
      header: "Clasificación",
      accessorKey: "OBJ_CLASIFICACION.DESC_LARGA_V",
    },
    {
      header: "Fecha doc",
      accessorKey: "dayOfBirth",
      footer: "Mi fecha de nacimiento",
      cell: (info) => dayjs(info.getValue()).format("DD/MM/YYYY"),
    },
    {
      header: "Origen",
      accessorKey: "DOCU_EXTERIOR_INTERIOR",
    },
  ];

  console.log(datax);



    useEffect(() => {
    fetch('http://10.5.10.13:4000/reg-externo/origen?nivel=16')
    .then(response => response.json())
    .then(data => setDatax(data))
    .catch(error => console.error(error));
  }, []);


  return (
    <div>
      <SimpleTable datax={datax} columns={columns} />
    </div>
  );
}

export default TableComponent;


