import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { xlogin_true, xset_user, xlogin_false } from "../../../Redux/slice/usuarioAuthSlice";
import { verifyAuth } from "../../../api/apiAuthLogin";
import { useQuery } from "@tanstack/react-query";

export default function AuthProvider({ children }) {
  const dispatch = useDispatch();


   const { data, isLoading, isError, isSuccess } = useQuery({
    queryKey: ["auth", "verify"],
    queryFn: verifyAuth,
    retry: false,
    staleTime: 1000 * 60 * 10,
  });


  useEffect(() => {
    if (isSuccess && data) {
       dispatch(xlogin_true(true));
       dispatch(xset_user(data.user));
    }
    if (isError) {
      dispatch(xlogin_false());
    }
  }, [isSuccess, isError, data, dispatch]);

  if (isLoading) {
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
