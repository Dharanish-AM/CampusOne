import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// ── Thunk: fetchStudentComplaints ─────────────────────────────────────────────
export const fetchStudentComplaints = createAsyncThunk(
  "complaint/fetchStudentComplaints",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/complaints/student");
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch complaints";
      return rejectWithValue(message);
    }
  },
);

// ── Thunk: createComplaint ────────────────────────────────────────────────────
export const createComplaint = createAsyncThunk(
  "complaint/createComplaint",
  async (complaintData, { rejectWithValue }) => {
    try {
      const response = await api.post("/complaints", complaintData);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to file complaint";
      return rejectWithValue(message);
    }
  },
);

const initialState = {
  complaints: [],
  isLoading: false,
  error: null,
};

const complaintSlice = createSlice({
  name: "complaint",
  initialState,
  reducers: {
    clearComplaintError: (state) => {
      state.error = null;
    },
    updateComplaintInState: (state, action) => {
      const index = state.complaints.findIndex(
        (c) => c._id === action.payload._id,
      );
      if (index !== -1) {
        state.complaints[index] = action.payload;
      } else {
        state.complaints.unshift(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Student Complaints
      .addCase(fetchStudentComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints = action.payload;
      })
      .addCase(fetchStudentComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Complaint
      .addCase(createComplaint.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.isLoading = false;
        state.complaints.unshift(action.payload);
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearComplaintError, updateComplaintInState } =
  complaintSlice.actions;
export default complaintSlice.reducer;
