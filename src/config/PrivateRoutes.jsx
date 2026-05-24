import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";






export const PublicRoute = () => {
   const { auth } = useSelector((state) => state.USER_AUTH);

  if (auth) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};





export const PrivateRoute = ({ allowedRoles }) => {
  const { auth, roles_user } = useSelector((state) => state.USER_AUTH);


  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  console.log(allowedRoles);
  console.log(roles_user);

  const roleId = roles_user.map((role) => role.rol_id);

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles?.some((role) => roleId.includes(role));
    if (!hasPermission) {
      return <Navigate to="/no-autorizado" replace />;
    }
  }

  return <Outlet />;
};


