import axios from "axios";
import { API_ECO } from "./apiRest";
import { useQuery } from "@tanstack/react-query";



//? AUTH LOGIN **********************************************************************************/
export const authLogin = async (datos) => {
  const { data } = await axios.post(`${API_ECO}/auth/login`, datos, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};



//? CREATE USER  **********************************************************************************/
export const createUser = async (datos) => {
  const { data } = await axios.post(`${API_ECO}/auth/create-user`, datos, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};



//? CREATE USER  **********************************************************************************/
export const verifyAuthToken = async (datos) => {
  const { data } = await axios.post(`${API_ECO}/auth/verify-auth`, datos, {
    headers: {
      "Authorization": datos,
      "Content-Type": "application/json",
    },
  });
  return data;
};






// //? AUTH LOGIN **********************************************************************************/
// export const useAllSeccion = () => {
//   const ALL_SECCION = useQuery({
//     queryKey: ["all-seccion"],
//     queryFn: async () => {
//       const { data } = await axios.get(`${API_ECO}/auth/login`);
//       return data;
//     },
//     staleTime: 3600000 * 2
//   });

//   return ALL_SECCION

// };