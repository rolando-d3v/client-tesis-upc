import { configureStore } from "@reduxjs/toolkit";
// import { setupListeners } from "@reduxjs/toolkit/query/react";


import usuarioAuthSlice from "./usuarioAuthSlice";
import settingAppSlice from "./settingAppSlice";
import cartSlice from "./cartSlice";



export const store = configureStore({
  reducer: {

    SETTING_APP: settingAppSlice,
    USER_AUTH: usuarioAuthSlice,
    CART_APP: cartSlice,
  }
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware().concat(apiDocumento.middleware),

});

// setupListeners(store.dispatch);
