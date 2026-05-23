import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  auth: null,
  user: null,
  roles_user:[]
};

export const usuarioSlice = createSlice({
  name: "usuarioAuthSlice",
  initialState,

  reducers: {
    xlogin_true: (state, action) => {
      state.auth = action.payload;
    },
    xset_user: (state, action) => {
      state.user = action.payload;
      state.roles_user = action.payload.rol;
    },
    xlogin_false: (state) => {
      state.auth = null;
      state.user = null;
    },
  },
});

export const {
  xlogin_true,
  xlogin_false,
  xset_user,
} = usuarioSlice.actions;

export default usuarioSlice.reducer;
