import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MENU_CACHE_KEY = "campusone:cafeteria:menu";

// ── Thunk: fetchCanteenMenu ──────────────────────────────────────────────────
export const fetchCanteenMenu = createAsyncThunk(
  "cafeteria/fetchMenu",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/cafeteria/menu");
      const menu = response.data.data;
      
      // Save menu to AsyncStorage cache
      try {
        await AsyncStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menu));
      } catch (cacheErr) {
        console.warn("Failed to write canteen menu cache:", cacheErr.message);
      }
      
      return menu;
    } catch (error) {
      // Offline fallback: load from AsyncStorage if network fails
      try {
        const cachedMenu = await AsyncStorage.getItem(MENU_CACHE_KEY);
        if (cachedMenu) {
          console.log("Loading offline canteen menu from cache...");
          return JSON.parse(cachedMenu);
        }
      } catch (cacheErr) {
        console.warn("Failed to read canteen menu cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch canteen menu"
      );
    }
  }
);

// ── Thunk: placeCanteenOrder ─────────────────────────────────────────────────
export const placeCanteenOrder = createAsyncThunk(
  "cafeteria/placeOrder",
  async (orderItems, { rejectWithValue }) => {
    try {
      const response = await api.post("/cafeteria/order", { items: orderItems });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to place canteen order"
      );
    }
  }
);

// ── Thunk: fetchStudentOrdersHistory ─────────────────────────────────────────
export const fetchStudentOrdersHistory = createAsyncThunk(
  "cafeteria/fetchHistory",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/cafeteria/orders/history");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch order history"
      );
    }
  }
);

const initialState = {
  menu: [],
  orders: [],
  cart: {}, // Format: { [itemId]: quantity }
  isLoading: false,
  submitting: false,
  error: null,
};

const cafeteriaSlice = createSlice({
  name: "cafeteria",
  initialState,
  reducers: {
    clearCafeteriaErrors: (state) => {
      state.error = null;
    },
    addToCart: (state, action) => {
      const itemId = action.payload;
      state.cart[itemId] = (state.cart[itemId] || 0) + 1;
    },
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      if (state.cart[itemId] > 1) {
        state.cart[itemId] -= 1;
      } else {
        delete state.cart[itemId];
      }
    },
    clearCart: (state) => {
      state.cart = {};
    },
    handleSocketOrderUpdate: (state, action) => {
      const { orderId, status } = action.payload;
      const orderIndex = state.orders.findIndex((ord) => ord._id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
        if (status === "completed") {
          state.orders[orderIndex].paymentStatus = "paid";
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Menu
      .addCase(fetchCanteenMenu.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCanteenMenu.fulfilled, (state, action) => {
        state.isLoading = false;
        state.menu = action.payload;
      })
      .addCase(fetchCanteenMenu.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Place Order
      .addCase(placeCanteenOrder.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(placeCanteenOrder.fulfilled, (state, action) => {
        state.submitting = false;
        state.orders.unshift(action.payload);
        state.cart = {}; // Clear cart on success
      })
      .addCase(placeCanteenOrder.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Fetch History
      .addCase(fetchStudentOrdersHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentOrdersHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchStudentOrdersHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearCafeteriaErrors,
  addToCart,
  removeFromCart,
  clearCart,
  handleSocketOrderUpdate,
} = cafeteriaSlice.actions;

export default cafeteriaSlice.reducer;
