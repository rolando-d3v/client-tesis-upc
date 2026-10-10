import { createBrowserRouter, Navigate } from "react-router";
import LayoutLogin from "../modules/auth/pages/login/layout-login/LayoutLogin";
import { PrivateRoute, PublicRoute } from "./PrivateRoutes";
import MainLayout from "../layout/admin_layout/layout/MainLayout";
import TablaPage from "../modules/auth/pages/tabla/Tabla";

// Eventos — Risk Dashboard
import CargaCSVEventos from "../modules/eventos/pages/CargaCSVEventos/CargaCSVEventos";
import Dashboard2Usuarios from "../modules/eventos/pages/Dashboard2Usuarios/Dashboard2Usuarios";
import Dashboard4Clasificacion from "../modules/eventos/pages/Dashboard4Clasificacion/Dashboard4Clasificacion";
import ComingSoon from "../components/ComingSoon";
import EntrenamientoPage from "../modules/entrenamiento/pages/EntrenamientoPage";
import MotorEventos from "../modules/MotorDeteccion/MotorEventos";


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
            element: <Navigate to="/eventos/usuarios" replace />,
          },
          { path: "/dashboard", element: <Navigate to="/eventos/usuarios" replace /> },

          // Aplicación enfocada en el dataset y el pipeline de eventos.
          { path: "/carga_eventos", element: <CargaCSVEventos /> },
          { path: "/eventos/usuarios", element: <Dashboard2Usuarios /> },
          { path: "/eventos/clasificacion", element: <Dashboard4Clasificacion /> },
          { path: "/entrenamiento", element: <EntrenamientoPage /> },
          { path: "/eventos/motor-deteccion", element: <MotorEventos /> },
          { path: "/eventos/monitoreo-vivo", element: <MotorEventos /> },
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
