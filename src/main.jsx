
import { createRoot } from "react-dom/client";
import { store } from "./Redux/store";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProvider from "./modules/auth/components/AuthProvider";
import { Toaster } from "sonner";
import { RouterProvider } from "react-router/dom";
import { router } from "./config/routes";
import "./styles/index.css";


const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div style={{ padding: 10, minHeight: "100vh" }}>
            <Toaster richColors position="top-right" />
            <RouterProvider router={router} />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  </>,
);
