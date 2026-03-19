import { createBrowserRouter } from "react-router";
import RootLayout from "./root_layout/layout/RootLayout";
import LayoutLogin from "../pages/login/layout-login/LayoutLogin";
import { PublicRoute } from "./PrivateRoutes";

const NoFount = () => {
  return <div>Fount 404</div>;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <PublicRoute element={<LayoutLogin />} />,
  },
  {
    path: "/",
    element: <RootLayout />,

    // children: [
    //   {
    //     path: "/",
    //     element: <LayoutHome />,
    //   },
    //   {
    //     path: "registro",
    //     element: <PublicRoute element={<LayoutRegistro />} />,
    //   },
    //   {
    //     path: "nosotros",
    //     element: <LayoutNosotros />,
    //   },
    //   {
    //     path: "carrito",
    //     element: <LayoutCarrito />,
    //   },
    //   {
    //     path: "producto/:id",
    //     element: <ProductoDetalle />,
    //   },
    //   {
    //     path: "muebles",
    //     element: <LayoutProducto />,
    //     children: [
    //       {
    //         path: "/muebles/:name",
    //         element: <ProductoItem />, // Ruta dentro del layout admin para crear productos
    //       },
    //     ],
    //   },
    //   // USER AUTH
    //   {
    //     path: "pagos",
    //     element: <PrivateRouteUser element={<LayoutPagos />} />,
    //   },
    //   {
    //     path: "data-user",
    //     element: <PrivateRouteUser element={<LayoutUser />} />,
    //   },
    //   // ADMIN AUTH
    //   {
    //     path: "admin",
    //     element: <PrivateRouteAdmin element={<AdminLayout />} />, // Solo accesible para admin
    //     children: [
    //       {
    //         path: "productos",
    //         element: <LayoutProductosAdmin />, // Ruta dentro del layout admin para crear productos
    //       },
    //       {
    //         path: "lista-productos",
    //         element: <LayoutAllProductosAdmin />, // Ruta dentro del layout admin para crear productos
    //       },
    //       {
    //         path: "editar-producto/:id",
    //         element: <LayoutEditarProductoAdmin />,
    //       },
    //       {
    //         path: "usuarios",
    //         element: <LayoutUsuariosAdmin />, // Ruta dentro del layout admin para crear productos
    //       },
    //       {
    //         path: "secciones-categorias",
    //         element: <SeccionesCategoriasAdmin />,
    //       },
    //     ],
    //   },
    //   {
    //     path: "*",
    //     element: <NoFount />,
    //   },
    // ],
  },
]);
