import { createBrowserRouter } from "react-router";
import LayoutLogin from "../modules/auth/pages/login/layout-login/LayoutLogin";
import { PrivateRoute, PublicRoute } from "./PrivateRoutes";
import MainLayout from "../layout/admin_layout/layout/MainLayout";
import TablaPage from "../modules/auth/pages/tabla/Tabla";
import DashboardAnomaliasPage from "../modules/anomalias/pages/dashboard_page/layout/DashboardAnomaliasPage";
import TablaAnomaliasPage from "../modules/anomalias/pages/tabla_anomalias_page/TablaAnomaliaPage";
import TimelineAnomalias from "../modules/anomalias/pages/timelineAnomalia/TimelineAnomalias";
import CargaAnomalias from "../modules/anomalias/pages/carga_csv_anomalias/CargaAnomalias";


const NoFount = () => {
  return <div>Fount 404</div>;
};

const ComingSoon = ({ title }) => (
  <div style={{ padding: "2rem" }}>
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
          { path: "/anomalias", element: <DashboardAnomaliasPage /> },
          { path: "/carga_anomalias", element: <CargaAnomalias /> },
          { path: "/anomalias/tabla", element: <TablaAnomaliasPage /> },
          { path: "/anomalias/timeline", element: <TimelineAnomalias /> },
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
