import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";






export const PublicRoute = () => {
   const { auth } = useSelector((state) => state.USER_AUTH);

  if (auth) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};





export const PrivateRoute = ({ allowedRoles }) => {
  const { auth, roles_user } = useSelector((state) => state.USER_AUTH);
  // const { isAuthenticated, roles } = useAuth();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  // console.log(allowedRoles);
  // console.log(role_opcion);

  const roleId = roles_user.map((role) => role.id);

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some((role) => roleId.includes(role));
    if (!hasPermission) {
      return <Navigate to="/no-autorizado" replace />;
    }
  }

  return <Outlet />;
};


