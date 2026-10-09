import { createBrowserRouter } from "react-router";
import LayoutLogin from "../modules/auth/pages/login/layout-login/LayoutLogin";
import { PrivateRoute, PublicRoute } from "./PrivateRoutes";
import MainLayout from "../layout/admin_layout/layout/MainLayout";
import TablaPage from "../modules/auth/pages/tabla/Tabla";
import DashboardAnomaliasPage from "../modules/trazabilidad/pages/dashboard_page/layout/DashboardAnomaliasPage";
import TablaAnomaliasPage from "../modules/trazabilidad/pages/tabla_anomalias_page/TablaAnomaliaPage";
import TimelineAnomalias from "../modules/trazabilidad/pages/timelineAnomalia/TimelineAnomalias";
import CargaAnomalias from "../modules/trazabilidad/pages/carga_csv_anomalias/CargaAnomalias";

// Eventos — Risk Dashboard
import CargaCSVEventos from "../modules/eventos/pages/CargaCSVEventos/CargaCSVEventos";
import Dashboard2Usuarios from "../modules/eventos/pages/Dashboard2Usuarios/Dashboard2Usuarios";
import Dashboard4Clasificacion from "../modules/eventos/pages/Dashboard4Clasificacion/Dashboard4Clasificacion";
import MotorDeteccion from "../modules/MotorDeteccion/MotorDeteccion";

// Módulo de Entrenamiento & Calibración
import EntrenamientoPage from "../modules/entrenamiento/pages/EntrenamientoPage";
import IncidenteDetallePage from "../modules/entrenamiento/pages/IncidenteDetallePage";
import ComingSoon from "../components/ComingSoon";


export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <LayoutLogin />,
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

          // Eventos — Risk Dashboard & Motor de Detección
          { path: "/carga_eventos", element: <CargaCSVEventos /> },
          { path: "/eventos/usuarios", element: <Dashboard2Usuarios /> },
          { path: "/eventos/clasificacion", element: <Dashboard4Clasificacion /> },
          { path: "/eventos/motor-deteccion", element: <MotorDeteccion /> },
          { path: "/eventos/monitoreo-vivo", element: <MotorDeteccion /> },
          // Detalle forense desde Motor de Deteccion (mantiene contexto de navegacion)
          { path: "/eventos/motor-deteccion/incidente/:id", element: <IncidenteDetallePage /> },
          { path: "/eventos/monitoreo-vivo/incidente/:id", element: <IncidenteDetallePage /> },

          // Módulo de Entrenamiento y Calibración
          { path: "/entrenamiento", element: <EntrenamientoPage /> },
          { path: "/entrenamiento/:id", element: <IncidenteDetallePage /> },
          { path: "/incidentes", element: <EntrenamientoPage /> },
          { path: "/incidentes/:id", element: <IncidenteDetallePage /> },
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
        ],
      },
    ],
  },
  {
    path: "*",
    element: <ComingSoon title="Página no encontrada (404)" />,
  },
]);
