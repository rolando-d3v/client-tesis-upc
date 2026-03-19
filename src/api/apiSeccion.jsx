import axios from "axios";
import { API_ECO } from "./apiRest";
import { useQuery } from "@tanstack/react-query";

//? ALL SECCION **********************************************************************************/
export const useAllSeccion = () => {
  const ALL_SECCION = useQuery({
    queryKey: ["all-seccion"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ECO}/seccion/all-seccion`);
      return data;
    },
    // staleTime: 3600000 * 2,
  });

  return ALL_SECCION;
};

// //? ALL SISTEMAS Y SUS ROLES **********************************************************************************/
// export const useSistemaRolesID = (SISTEMA, ROLE) => {
//   const ALL_SISTEMA_ROLES = useQuery({
//     queryKey: ["sistema_roles", SISTEMA, ROLE],
//     queryFn: async () => {
//       const { data } = await axios.get(`${API_PERSONAL}/sistema/id-roles?sistema=${SISTEMA}&role=${ROLE}`);
//       return data;
//     },
//     staleTime: 3600000 * 2
//   });

//   return ALL_SISTEMA_ROLES

// };
