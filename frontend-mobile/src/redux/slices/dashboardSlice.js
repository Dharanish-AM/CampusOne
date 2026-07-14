import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = "http://192.168.0.109:5000/api/dashboard";

// ── Helper: build Authorization headers ──────────────────────────────────────
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem("accessToken");
  return { Authorization: `Bearer ${token}` };
};

// ── Thunk: fetchDashboardData ──────────────────────────────────────────────────
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(API_URL, { headers });
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load dashboard";
      return rejectWithValue(message);
    }
  },
);

// ── Slice ──────────────────────────────────────────────────────────────────────
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    data: null,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    clearDashboard: (state) => {
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
