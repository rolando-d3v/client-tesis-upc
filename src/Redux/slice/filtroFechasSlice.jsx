import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fechaInicio: null, // string ISO "YYYY-MM-DD" o null
  fechaFin: null,
};

export const filtroFechasSlice = createSlice({
  name: "filtroFechas",
  initialState,
  reducers: {
    setFechaInicio: (state, action) => {
      state.fechaInicio = action.payload || null;
    },
    setFechaFin: (state, action) => {
      state.fechaFin = action.payload || null;
    },
    setRangoFechas: (state, action) => {
      state.fechaInicio = action.payload.fechaInicio || null;
      state.fechaFin = action.payload.fechaFin || null;
    },
    limpiarFechas: (state) => {
      state.fechaInicio = null;
      state.fechaFin = null;
    },
  },
});

export const { setFechaInicio, setFechaFin, setRangoFechas, limpiarFechas } =
  filtroFechasSlice.actions;

export default filtroFechasSlice.reducer;
