import { createBrowserRouter } from "react-router";
import LayoutLogin from "../pages/login/layout-login/LayoutLogin";
import { PrivateRoute, PublicRoute } from "./PrivateRoutes";
import MainLayout from "../router/admin_layout/layout/MainLayout";

const NoFount = () => {
  return <div>Fount 404</div>;
};

const ComingSoon = ({ title }) => (
  <div style={{ padding: "2rem" }}>
    <h2>{title}</h2>
    <p style={{ color: "var(--text)", marginTop: "0.5rem" }}>
      Esta sección está en desarrollo...
    </p>

    <h2>{title}</h2>
    <p style={{ color: "var(--text)", marginTop: "0.5rem" }}>
      Esta sección está en desarrollo...
    </p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <PublicRoute element={<LayoutLogin />} />,
  },

  {
    element: <PrivateRoute allowedRoles={[1]} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
            element: <ComingSoon title="Gestión de Colegios" />,
          },
          // {
          //   path: "/super-admin/role-opcion",
          //   element: <RoleOpcionPage />,
          // },
        ],
      },
    ],
  },
  {
    element: <PrivateRoute allowedRoles={[2]} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/super-admin/colegios",
            element: <ComingSoon title="Gestión de Colegios" />,
          },
          // {
          //   path: "/super-admin/role-opcion",
          //   element: <RoleOpcionPage />,
          // },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <ComingSoon title="Página no encontrada (404)" />,
  },
]);
