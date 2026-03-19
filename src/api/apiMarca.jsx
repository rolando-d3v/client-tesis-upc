import axios from "axios";
import { API_ECO } from "./apiRest";
import { useQuery } from "@tanstack/react-query";

//? ALL SECCION **********************************************************************************/
export const useAllMarca = () => {
  const ALL_MARCA = useQuery({
    queryKey: ["all-marca"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ECO}/marca/all-marca`);
      return data;
    },
    staleTime: 3600000 * 2,
  });

  return ALL_MARCA;
};

