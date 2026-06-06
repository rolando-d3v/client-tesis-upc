import api from "./apiRestMachine";


//? AUTH LOGIN **********************************************************************************/
export const authLogin = async (datos) => {
  const { data } = await api.post("/auth/login", datos);
  return data;
};


//? CREATE USER  **********************************************************************************/
export const createUser = async (datos) => {
  const { data } = await api.post("/auth/create-user", datos);
  return data;
};


//? VERIFY AUTH — verifica la cookie httpOnly **********************************************************************************/
export const verifyAuth = async () => {
  const { data } = await api.get("/auth/verify");
  return data;
};


//? LOGOUT — limpia la cookie httpOnly **********************************************************************************/
export const logoutAuth = async () => {
  const { data } = await api.post("/auth/logout");
  return data;
};