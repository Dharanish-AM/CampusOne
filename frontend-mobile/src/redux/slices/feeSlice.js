import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Cache key identifier
const INVOICES_CACHE_KEY = "campusone:fees:invoices";

// ── Thunk: fetchStudentInvoices ─────────────────────────────────────────────
export const fetchStudentInvoices = createAsyncThunk(
  "fees/fetchStudentInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/fees/invoices");
      const invoices = response.data.data;
      
      // Persist to AsyncStorage for offline backup
      try {
        await AsyncStorage.setItem(INVOICES_CACHE_KEY, JSON.stringify(invoices));
      } catch (cacheErr) {
        console.warn("Failed to write invoices to AsyncStorage cache:", cacheErr.message);
      }
      
      return invoices;
    } catch (error) {
      // Offline fallback: load from AsyncStorage if network fails
      try {
        const cachedInvoices = await AsyncStorage.getItem(INVOICES_CACHE_KEY);
        if (cachedInvoices) {
          console.log("Loading offline fee invoices from cache...");
          return JSON.parse(cachedInvoices);
        }
      } catch (cacheErr) {
        console.warn("Failed to retrieve invoices from AsyncStorage cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch invoices"
      );
    }
  }
);

// ── Thunk: initiateFeePayment ───────────────────────────────────────────────
export const initiateFeePayment = createAsyncThunk(
  "fees/initiateFeePayment",
  async ({ invoiceId, paymentMethod }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/fees/pay/${invoiceId}`, { paymentMethod });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to initiate payment"
      );
    }
  }
);

const initialState = {
  invoices: [],
  isLoading: false,
  submitting: false,
  error: null,
  checkoutData: null,
};

const feeSlice = createSlice({
  name: "fees",
  initialState,
  reducers: {
    clearFeeErrors: (state) => {
      state.error = null;
    },
    clearCheckoutData: (state) => {
      state.checkoutData = null;
    },
    handleSocketPaymentUpdate: (state, action) => {
      // Invoked when payment notification message is received on Socket.io
      const { studentId, invoiceId, amount } = action.payload;
      const invoiceIndex = state.invoices.findIndex((inv) => inv._id === invoiceId);
      if (invoiceIndex !== -1) {
        const invoice = state.invoices[invoiceIndex];
        invoice.amountPaid += amount;
        if (invoice.amountPaid >= invoice.amountDue) {
          invoice.status = "paid";
        } else {
          invoice.status = "partially_paid";
        }
        invoice.paymentDate = new Date().toISOString();
        
        // Write the updated state back to the cache
        AsyncStorage.setItem(INVOICES_CACHE_KEY, JSON.stringify(state.invoices)).catch((err) =>
          console.warn("Failed to update cache on live socket update:", err.message)
        );
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Invoices
      .addCase(fetchStudentInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
      })
      .addCase(fetchStudentInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Initiate Payment
      .addCase(initiateFeePayment.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.checkoutData = null;
      })
      .addCase(initiateFeePayment.fulfilled, (state, action) => {
        state.submitting = false;
        state.checkoutData = action.payload;
      })
      .addCase(initiateFeePayment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearFeeErrors, clearCheckoutData, handleSocketPaymentUpdate } = feeSlice.actions;
export default feeSlice.reducer;
