import styles from "./routerHome.module.css";
import { Outlet } from "react-router";
import Navigator from "../navigator/Navigator";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  xlogin_true,
  xpersonal,
  xroles_user,
  xlogin_false,
} from "../../../Redux/usuarioAuthSlice";
import axios from "axios";
import { API_ECO } from "../../../api/apiRest";

export default function RootLayout() {
  const dispatch = useDispatch();
  // console.log(API_ECO);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("TK_ECO");

    if (!token) {
      console.log("no token");
      setLoading(false);
    } else {
      const obtenerUser = async () => {
        try {
          const verifyToken = await axios.post(
            `${API_ECO}/auth/verify-auth`,
            token,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log(verifyToken.data.user.uuid);

          const dataPersona = await axios.get(
            `${API_ECO}/user/role/${verifyToken?.data?.user?.uuid} `
          );

          // console.log(dataPersona.data);
          // console.log(dataPersona.data.usuario_role);

          dispatch(xroles_user(dataPersona.data.usuario_role));
          dispatch(xpersonal(dataPersona.data));
          dispatch(xlogin_true(true));
        } catch (error) {
          console.log(error);
          sessionStorage.removeItem("TK_ECO");
          dispatch(xlogin_false());
        } finally {
          setLoading(false);
        }
      };

      obtenerUser();
    }
  }, [dispatch]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
        }}
      >
        <h1>Cargando...</h1>
      </div>
    );
  }

  return (
    <div className={`${styles.theme} `}>
      <Navigator />
      <main className={styles.main_x}>
        <Outlet />
      </main>
    </div>
  );
}
