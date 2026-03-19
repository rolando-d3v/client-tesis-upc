import axios from "axios";
import { API_ECO } from "./apiRest";
import { useQuery } from "@tanstack/react-query";

//? ALL SECCION **********************************************************************************/
export const useAllCategoria = () => {
  const ALL_CATEGORIA = useQuery({
    queryKey: ["all-categoria"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ECO}/categoria/all-categoria`);
      return data;
    },
    staleTime: 3600000 * 2,
  });

  return ALL_CATEGORIA;
};

