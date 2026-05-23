import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { xlogin_true, xset_user } from "../Redux/slice/usuarioAuthSlice";
import { verifyAuth } from "../api/apiAuthLogin";

export default function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await verifyAuth();

        if (data.ok) {
          dispatch(xlogin_true(true));
          dispatch(xset_user(data.user));
        }
      } catch (err) {
        // Cookie no existe o expiró — el usuario no está autenticado
        console.log("No hay sesión activa");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        fontSize: "1.1rem",
        fontFamily: "system-ui, sans-serif"
      }}>
        Verificando sesión...
      </div>
    );
  }

  return children;
}
