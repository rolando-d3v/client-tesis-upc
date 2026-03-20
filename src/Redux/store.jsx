import { configureStore } from "@reduxjs/toolkit";


import usuarioAuthSlice from "./usuarioAuthSlice";
import settingAppSlice from "./settingAppSlice";
import cartSlice from "./cartSlice";



export const store = configureStore({
  reducer: {
    SETTING_APP: settingAppSlice,
    USER_AUTH: usuarioAuthSlice,
    CART_APP: cartSlice,
  }

});

