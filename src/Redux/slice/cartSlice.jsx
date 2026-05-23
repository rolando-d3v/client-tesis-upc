import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: { list: [], total: 0 },
  reducers: {
    addToCart(state, action) {
      const check = state.list.findIndex(
        (book) => book.id_producto_i === action.payload.id_producto_i
      );
      if (check !== -1) {
        state.list[check].quantity += action.payload.quantity;
      } else {
        state.list.push(action.payload);
      }

      state.total = state.list.reduce(
        (sum, book) => sum + +book?.precio_d * book?.quantity,
        0
      );
    },

    
    updateQuantity(state, action) {
      const check = state.list.findIndex(
        (book) => book.id_producto_i === action.payload.id_producto_i
      );
      if (check !== -1) {
        state.list[check].quantity = action.payload.quantity;
      }
      state.total = state.list.reduce(
        (sum, book) => sum + +book?.precio_d * book?.quantity,
        0
      );
    },
    removeItem(state, action) {
      state.list = state.list.filter((cart) => cart.id_producto_i !== action.payload.id_producto_i);
      state.total = state.list.reduce(
        (sum, book) => sum + +book?.precio_d * book?.quantity,
        0
      );
    },
  },
});

export const { addToCart, updateQuantity, removeItem } = cartSlice.actions;

export default cartSlice.reducer;
