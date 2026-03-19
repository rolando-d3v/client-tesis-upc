import axios from "axios";
import { API_ECO } from "./apiRest";
import { useQuery } from "@tanstack/react-query";

//? ALL IMAGEN PRO X ID **********************************************************************************/
export const useAllImagenProducto = (id) => {
  const ALL_IMAGE_PRO = useQuery({
    queryKey: ["all_imagen_producto", id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ECO}/image-pro/all-image-id?id=${id}`);
      return data;
    },
    // staleTime: 3600000 * 2,
  });

  return ALL_IMAGE_PRO;
};





//? CREATE ALL IMAGEN PRO X ID **********************************************************************************/
export const createAllImagenPro = async (formData) => {
  const { data } = await axios.post(`${API_ECO}/image-pro/create-image`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
};


//? DELETE ONE IMAGEN PRO X ID **********************************************************************************/
export const deleteImagenPro = async (datax) => {
  const { data } = await axios.delete(`${API_ECO}/image-pro/delete-image?id=${datax.id}&id_img=${datax.id_img}`);
  return data;
};