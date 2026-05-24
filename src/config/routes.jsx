import { createBrowserRouter } from "react-router";
import LayoutLogin from "../modules/auth/pages/login/layout-login/LayoutLogin";
import { PrivateRoute, PublicRoute } from "./PrivateRoutes";
import MainLayout from "../router/admin_layout/layout/MainLayout";
import TablaPage from "../modules/auth/pages/tabla/Tabla";

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
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <LayoutLogin />,
        // { path: "/register", element: <RegisterUserPage /> },
        // { path: "/recover", element: <RecoverPage /> },
      },
    ],
  },

  {
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
            element: <ComingSoon title="Gestión de Colegios" />,
          },
          { path: "/dashboard", element: <ComingSoon title="Dashboard" /> },
       
        ],
      },
    ],
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
          { path: "/dashboard", element: <ComingSoon title="Dashboard" /> },
          // {
          //   path: "/tabla",
          //   element: <TablaPage />,
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
            path: "/user",
            element: <ComingSoon title="Gestión de Colegios" />,
          },
          {
            path: "/user/tabla",
            element: <TablaPage />,
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
