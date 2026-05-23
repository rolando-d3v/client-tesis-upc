import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  personal_select: null,
  role_select: null,
  // auth: true,
  auth: null,
  email: null,
  roles_user: [],
  dni: null,
  personal: null,
};

export const usuarioSlice = createSlice({
  name: "usuarioAuthSlice",
  initialState,

  reducers: {
    xpersonal: (state, action) => {
      state.personal = action.payload;
    },
    xlogin_true: (state, action) => {
      state.auth = action.payload;
    },
    xroles_user: (state, action) => {
      state.roles_user = action.payload;
    },
   
    xlogin_false: (state, action) => {
      state.auth = null;
      sessionStorage.removeItem("TK_ECO")
    },
  },
});

export const {
  xlogin_true,
  xlogin_false,
  xpersonal,
  xroles_user,



  nivel1_nivel3,
  xdefault_nivel_1,
  xdefault_opciones
} = usuarioSlice.actions;

export default usuarioSlice.reducer;
