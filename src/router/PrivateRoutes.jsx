import { Navigate } from "react-router";
import { useSelector } from "react-redux";

export const PrivateRouteUser = ({ element }) => {
  const { auth, roles_user } = useSelector((state) => state.USER_AUTH);
  console.log(auth, roles_user);
  const isAuth =
    !!auth &&
    roles_user.some((role) => role.role_id === 1 || role.role_id === 2);
 
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return element;
};





export const PrivateRouteAdmin = ({ element }) => {
  const { auth, roles_user } = useSelector((state) => state.USER_AUTH);
  console.log(auth, roles_user);
  // const roleIds = roles_user.map(role => role.role_id);
  // console.log(roleIds);
  const isAuth = !!auth && roles_user.some((role) => role.role_id === 2);
  // const isAuth = !!auth && roles_user.includes(2);
  // const isAuth = !!auth && roles_user.includes("admin");
  console.log(isAuth);
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  return element;
};





export const PublicRoute = ({ element }) => {
  const { auth } = useSelector((state) => state.USER_AUTH);

  if (auth) {
    return <Navigate to="/" replace />;
  }

  return element;
};
