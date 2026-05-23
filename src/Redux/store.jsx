import { configureStore } from "@reduxjs/toolkit";


import usuarioAuthSlice from "./slice/usuarioAuthSlice";
import settingAppSlice from "./slice/settingAppSlice";
import cartSlice from "./slice/cartSlice";



export const store = configureStore({
  reducer: {
    SETTING_APP: settingAppSlice,
    USER_AUTH: usuarioAuthSlice,
    CART_APP: cartSlice,
  }

});

