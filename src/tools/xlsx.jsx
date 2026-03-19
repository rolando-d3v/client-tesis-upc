// import dayjs from "dayjs";
// import xlsx from "json-as-xlsx";
// // import { people } from "@/people";

// export function downloadToExcel(data) {
//   console.log(data);
//   let columns = [
//     {
//       sheet: "Persons",
//       columns: [
//         { label: "ID", value: "ID_DOCUMENTO_I" },
//         { label: "tipo doc", value: "tipo_documento.DESC_CORTA_V" },
//         { label: "Numero doc", value: "NUMERO_V" },
//         { label: "Clasificacion", value: "clasificacion_doc.DESC_LARGA_V" },
//         { label: "Externo o Interno", value: "DOCU_EXTERIOR_INTERIOR" },
//         { label: "Unidad de origen", value: "UU_ORIGEN_NAME_V" },
//         { label: "Sistema envio", value: "medio_envio.DESC_CORTA_V" },
//         {
//           label: "Fecha doc",
//           value: (row) => dayjs(row?.FECHA_DOC_D).utc().format("DD-MM-YYYY"),
//         },
//         {
//           label: "Fecha creacion doc",
//           value: (row) =>
//             dayjs(row?.FECHA_CREATE_D).utc().format("DD-MM-YYYY - HH:mm"),
//         },
//         { label: "Asunto del documento", value: "ASUNTO_T" },
//       ],
//       content: data,
//     },
//   ];

//   let settings = {
//     fileName: "Documentos",
//   };

//   xlsx(columns, settings);
// }
