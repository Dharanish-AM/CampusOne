import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DIRECTORY_CACHE_KEY = "campusone:alumni:directory";

// ── Thunk: fetchAlumniDirectory ──────────────────────────────────────────────
export const fetchAlumniDirectory = createAsyncThunk(
  "alumni/fetchDirectory",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/alumni", { params });
      const directory = response.data.data;

      // Cache the full directory when no search query or filters are applied
      if (!params.q && (!params.department || params.department === "all") && !params.isMentor) {
        try {
          await AsyncStorage.setItem(DIRECTORY_CACHE_KEY, JSON.stringify(directory));
        } catch (cacheErr) {
          console.warn("Failed to write alumni cache:", cacheErr.message);
        }
      }

      return directory;
    } catch (error) {
      try {
        const cachedDir = await AsyncStorage.getItem(DIRECTORY_CACHE_KEY);
        if (cachedDir) {
          console.log("Loading offline alumni directory from cache...");
          return JSON.parse(cachedDir);
        }
      } catch (cacheErr) {
        console.warn("Failed to read alumni cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch alumni directory"
      );
    }
  }
);

// ── Thunk: submitMentorshipRequest ───────────────────────────────────────────
export const submitMentorshipRequest = createAsyncThunk(
  "alumni/submitRequest",
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await api.post("/alumni/mentorship", requestData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to submit mentorship request"
      );
    }
  }
);

// ── Thunk: fetchMentorshipRequests ───────────────────────────────────────────
export const fetchMentorshipRequests = createAsyncThunk(
  "alumni/fetchRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/alumni/my-requests");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch mentorship requests"
      );
    }
  }
);

const initialState = {
  directory: [],
  requests: [],
  isLoading: false,
  submitting: false,
  error: null,
};

const alumniSlice = createSlice({
  name: "alumni",
  initialState,
  reducers: {
    clearAlumniErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Directory
      .addCase(fetchAlumniDirectory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAlumniDirectory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.directory = action.payload;
      })
      .addCase(fetchAlumniDirectory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Submit Mentorship Request
      .addCase(submitMentorshipRequest.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitMentorshipRequest.fulfilled, (state, action) => {
        state.submitting = false;
        state.requests.unshift(action.payload);
      })
      .addCase(submitMentorshipRequest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Fetch Mentorship Requests Logs
      .addCase(fetchMentorshipRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMentorshipRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchMentorshipRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAlumniErrors } = alumniSlice.actions;

export default alumniSlice.reducer;
