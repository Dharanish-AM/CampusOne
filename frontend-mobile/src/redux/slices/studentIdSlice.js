import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ID_CACHE_KEY = "campusone:studentid:details";

// ── Thunk: fetchStudentCard ──────────────────────────────────────────────────
export const fetchStudentCard = createAsyncThunk(
  "studentId/fetchCard",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/student-id/card");
      const card = response.data.data;

      try {
        await AsyncStorage.setItem(ID_CACHE_KEY, JSON.stringify(card));
      } catch (cacheErr) {
        console.warn("Failed to write student card cache:", cacheErr.message);
      }

      return card;
    } catch (error) {
      try {
        const cachedCard = await AsyncStorage.getItem(ID_CACHE_KEY);
        if (cachedCard) {
          console.log("Loading offline student card details from cache...");
          return JSON.parse(cachedCard);
        }
      } catch (cacheErr) {
        console.warn("Failed to read student card cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch student ID card"
      );
    }
  }
);

// ── Thunk: topupStudentWallet ────────────────────────────────────────────────
export const topupStudentWallet = createAsyncThunk(
  "studentId/topupWallet",
  async (amount, { rejectWithValue }) => {
    try {
      const response = await api.post("/student-id/wallet/topup", { amount });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to top up virtual wallet"
      );
    }
  }
);

// ── Thunk: fetchWalletTransactions ───────────────────────────────────────────
export const fetchWalletTransactions = createAsyncThunk(
  "studentId/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/student-id/wallet/transactions");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch wallet transactions"
      );
    }
  }
);

const initialState = {
  card: null,
  transactions: [],
  isLoading: false,
  submitting: false,
  error: null,
};

const studentIdSlice = createSlice({
  name: "studentId",
  initialState,
  reducers: {
    clearStudentIdErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch ID Card
      .addCase(fetchStudentCard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentCard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.card = action.payload;
      })
      .addCase(fetchStudentCard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Topup Wallet
      .addCase(topupStudentWallet.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(topupStudentWallet.fulfilled, (state, action) => {
        state.submitting = false;
        state.card = action.payload;
      })
      .addCase(topupStudentWallet.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Fetch Transaction Logs
      .addCase(fetchWalletTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWalletTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchWalletTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearStudentIdErrors } = studentIdSlice.actions;

export default studentIdSlice.reducer;
