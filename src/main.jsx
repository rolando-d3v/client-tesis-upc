import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { store } from "./Redux/store";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router/dom";
import { router } from "./router/AppRouter.jsx";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {/* <Toaster richColors /> */}
        <div style={{ padding: 10, minHeight: "100vh" }}>
          <RouterProvider router={router} />
        </div>
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
