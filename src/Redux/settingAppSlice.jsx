import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  
  select_categoria: false,
  estado_sidebar: true,
  estado_modal: false,
  estado_modal_full: false,
  estado_modal_jefe: false,
  estado_url_doc: "",
  isDarkMode: localStorage.getItem("isDarkMode") === "true" ? true : false,
};



const settingAppSlice = createSlice({
  name: "settingAppSlice",
  initialState,

  reducers: {

    x_select_categoria: (state, action) => {
      state.select_categoria = action.payload;
    },


    openToggleSidebar: (state, action) => {
      state.estado_sidebar = action.payload;
    },
    openModalBasex: (state, action) => {
      state.estado_modal = action.payload;
    },
    xopenModalFull: (state, action) => {
      state.estado_modal_full = action.payload;
    },
    xopenModalJefe: (state, action) => {
      state.estado_modal_jefe = action.payload;
    },
    url_docx: (state, action) => {
      state.estado_url_doc = action.payload;
    },
    toggleDarkMode: (state) => {
      const isDarkMode = !state.isDarkMode;
      localStorage.setItem("isDarkMode", isDarkMode);
      // Cookies.set('isDarkMode', isDarkMode)
      state.isDarkMode = isDarkMode;
    },
  },
});

export const {
  x_select_categoria,
  openToggleSidebar,
  openModalBasex,
  xopenModalFull,
  xopenModalJefe,
  url_docx,
  toggleDarkMode,
} = settingAppSlice.actions;

export default settingAppSlice.reducer;
