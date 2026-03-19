import axios from "axios";
import { API_ECO } from "./apiRest";
import { useQuery } from "@tanstack/react-query";

//? ALL PRODUCTOS **********************************************************************************/
export const useProductosEcommerce = () => {
  const ALL_PRODUCTOS_ECO = useQuery({
    queryKey: ["all_productos_ecommerce"],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ECO}/producto/all-productos-ecommerce`);
      return data;
    },
    // staleTime: 3600000 * 2,
  });

  return ALL_PRODUCTOS_ECO;
};


//? ALL PRODUCTOS X CATEGORIAS **********************************************************************************/
export const useProductosXCategoria = (idx) => {
  const ALL_PRODUCTOS_CATEGORIA = useQuery({
    queryKey: ["all_productos_x_categoria", idx],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ECO}/producto/all-productos-categoria?id=${idx}`);
      return data;
    },
    // staleTime: 3600000 * 2,
  });

  return ALL_PRODUCTOS_CATEGORIA;
};


//? ONE PRODUCTOS **********************************************************************************/
export const useOneProducto = (id) => {
  const ONE_PRODUCTO = useQuery({
    queryKey: ["one_productos", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ECO}/producto/one-productos/${id}`);
      return data;
    },
    // staleTime: 3600000 * 2,
  });

  return ONE_PRODUCTO;
};





//? CREATE PRODUCTOS  **********************************************************************************/
export const createProducto = async (datos) => {
  const { data } = await axios.post(`${API_ECO}/producto/create-producto`, datos, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
};


