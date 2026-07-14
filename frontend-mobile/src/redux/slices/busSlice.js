import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

export const fetchRoutes = createAsyncThunk(
  "bus/fetchRoutes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/bus/routes");
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch routes";
      return rejectWithValue(message);
    }
  },
);

export const fetchBusLocation = createAsyncThunk(
  "bus/fetchBusLocation",
  async (routeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bus/location/${routeId}`);
      return { routeId, data: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch bus location";
      return rejectWithValue(message);
    }
  },
);

const initialState = {
  routes: [],
  activeLocations: {}, // Map of { [routeId]: locationData }
  isLoading: false,
  error: null,
};

const busSlice = createSlice({
  name: "bus",
  initialState,
  reducers: {
    clearBusError: (state) => {
      state.error = null;
    },
    // Handler to process real-time socket coordinate streams
    updateLiveLocation: (state, action) => {
      const { routeId, latitude, longitude, occupancy, speed, updatedAt } =
        action.payload;
      state.activeLocations[routeId] = {
        latitude,
        longitude,
        occupancy,
        speed,
        updatedAt,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Routes
      .addCase(fetchRoutes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.routes = action.payload;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Bus Location
      .addCase(fetchBusLocation.fulfilled, (state, action) => {
        const { routeId, data } = action.payload;
        if (data) {
          state.activeLocations[routeId] = data;
        }
      });
  },
});

export const { clearBusError, updateLiveLocation } = busSlice.actions;
export default busSlice.reducer;
