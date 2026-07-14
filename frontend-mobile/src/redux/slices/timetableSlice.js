import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

export const fetchTimetable = createAsyncThunk(
  "timetable/fetchTimetable",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/timetable");
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch timetable";
      return rejectWithValue(message);
    }
  },
);

export const addTimetableItem = createAsyncThunk(
  "timetable/addTimetableItem",
  async (timetablePayload, { rejectWithValue }) => {
    try {
      const response = await api.post("/timetable", timetablePayload);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to create timetable slot";
      return rejectWithValue(message);
    }
  },
);

const initialState = {
  schedule: [],
  isLoading: false,
  error: null,
};

const timetableSlice = createSlice({
  name: "timetable",
  initialState,
  reducers: {
    clearTimetableError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Timetable
      .addCase(fetchTimetable.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTimetable.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedule = action.payload;
      })
      .addCase(fetchTimetable.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add Timetable Item
      .addCase(addTimetableItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTimetableItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedule.push(action.payload);
        // Sort schedule chronologically by start time
        state.schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
      })
      .addCase(addTimetableItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearTimetableError } = timetableSlice.actions;
export default timetableSlice.reducer;
