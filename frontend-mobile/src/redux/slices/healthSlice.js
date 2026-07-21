import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HEALTH_CACHE_KEY = "campusone:health:appointments";

// ── Thunk: fetchStudentAppointments ──────────────────────────────────────────
export const fetchStudentAppointments = createAsyncThunk(
  "health/fetchAppointments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/health/appointments/student");
      const appointments = response.data.data;

      // Cache the student's appointments locally
      try {
        await AsyncStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify(appointments));
      } catch (cacheErr) {
        console.warn("Failed to write health cache:", cacheErr.message);
      }

      return appointments;
    } catch (error) {
      try {
        const cached = await AsyncStorage.getItem(HEALTH_CACHE_KEY);
        if (cached) {
          console.log("Loading offline health appointments from cache...");
          return JSON.parse(cached);
        }
      } catch (cacheErr) {
        console.warn("Failed to read health cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch appointments"
      );
    }
  }
);

// ── Thunk: bookAppointment ───────────────────────────────────────────────────
export const bookAppointment = createAsyncThunk(
  "health/bookAppointment",
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/health/appointments", appointmentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to book appointment"
      );
    }
  }
);

// ── Thunk: cancelAppointment ──────────────────────────────────────────────────
export const cancelAppointment = createAsyncThunk(
  "health/cancelAppointment",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/health/appointments/${id}`, {
        status: "cancelled",
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to cancel appointment"
      );
    }
  }
);

const initialState = {
  appointments: [],
  isLoading: false,
  submitting: false,
  error: null,
};

const healthSlice = createSlice({
  name: "health",
  initialState,
  reducers: {
    clearHealthErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Appointments
      .addCase(fetchStudentAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchStudentAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Book Appointment
      .addCase(bookAppointment.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(bookAppointment.fulfilled, (state, action) => {
        state.submitting = false;
        state.appointments.unshift(action.payload);
      })
      .addCase(bookAppointment.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Cancel Appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.appointments.findIndex(
          (a) => a._id === action.payload._id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHealthErrors } = healthSlice.actions;
export default healthSlice.reducer;
