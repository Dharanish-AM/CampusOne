import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Thunks
export const fetchHostelAllocation = createAsyncThunk(
  "hostel/fetchAllocation",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/hostels/allocation");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch room allocation",
      );
    }
  },
);

export const submitGatePassRequest = createAsyncThunk(
  "hostel/submitGatePass",
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await api.post("/hostels/gatepass", requestData);
      return response.data;
    } catch (error) {
      // Extract specific zod validation error if present
      const message =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        "Failed to request gate pass";
      return rejectWithValue(message);
    }
  },
);

export const fetchGatePasses = createAsyncThunk(
  "hostel/fetchGatePasses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/hostels/gatepass/student");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch gate pass history",
      );
    }
  },
);

const initialState = {
  allocation: null,
  warden: null,
  roommates: [],
  gatePasses: [],
  loading: false,
  submitting: false,
  error: null,
  submitError: null,
};

const hostelSlice = createSlice({
  name: "hostel",
  initialState,
  reducers: {
    clearHostelErrors: (state) => {
      state.error = null;
      state.submitError = null;
    },
    addLiveGatePassUpdate: (state, action) => {
      // Find and update the gate pass in local state history
      const { gatePassId, status } = action.payload;
      const index = state.gatePasses.findIndex((gp) => gp._id === gatePassId);
      if (index !== -1) {
        state.gatePasses[index].status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch allocation
      .addCase(fetchHostelAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHostelAllocation.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.allocation = action.payload.data.allocation;
          state.warden = action.payload.data.warden;
          state.roommates = action.payload.data.roommates || [];
        } else {
          state.allocation = null;
          state.warden = null;
          state.roommates = [];
        }
      })
      .addCase(fetchHostelAllocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Submit Gate Pass
      .addCase(submitGatePassRequest.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(submitGatePassRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.gatePasses.unshift(action.payload.data);
      })
      .addCase(submitGatePassRequest.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })

      // Fetch Gate Passes
      .addCase(fetchGatePasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGatePasses.fulfilled, (state, action) => {
        state.loading = false;
        state.gatePasses = action.payload.data;
      })
      .addCase(fetchGatePasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHostelErrors, addLiveGatePassUpdate } = hostelSlice.actions;
export default hostelSlice.reducer;
