import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// ── Thunk: fetchJobs ──────────────────────────────────────────────────────────
export const fetchJobs = createAsyncThunk(
  "placement/fetchJobs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/placements/jobs");
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch job postings";
      return rejectWithValue(message);
    }
  },
);

// ── Thunk: applyJob ───────────────────────────────────────────────────────────
export const applyJob = createAsyncThunk(
  "placement/applyJob",
  async ({ jobId, resumeUrl }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/placements/jobs/${jobId}/apply`, {
        resumeUrl,
      });
      return { jobId, application: response.data.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit application";
      return rejectWithValue(message);
    }
  },
);

// ── Thunk: fetchStudentApplications ──────────────────────────────────────────
export const fetchStudentApplications = createAsyncThunk(
  "placement/fetchStudentApplications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/placements/applications/student");
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch applications";
      return rejectWithValue(message);
    }
  },
);

const initialState = {
  jobs: [],
  applications: [],
  isLoading: false,
  error: null,
  applySuccess: false,
};

const placementSlice = createSlice({
  name: "placement",
  initialState,
  reducers: {
    clearPlacementError: (state) => {
      state.error = null;
    },
    resetApplySuccess: (state) => {
      state.applySuccess = false;
    },
    updateApplicationInState: (state, action) => {
      // action.payload should be the updated application object
      const appIndex = state.applications.findIndex(
        (app) => app._id === action.payload._id,
      );
      if (appIndex !== -1) {
        state.applications[appIndex] = {
          ...state.applications[appIndex],
          ...action.payload,
        };
      }

      // Also update applicationStatus in the jobs list
      const jobIndex = state.jobs.findIndex(
        (job) =>
          job._id === action.payload.jobId ||
          job._id === action.payload.jobId?._id,
      );
      if (jobIndex !== -1) {
        state.jobs[jobIndex].hasApplied = true;
        state.jobs[jobIndex].applicationStatus = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Apply Job
      .addCase(applyJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.applySuccess = false;
      })
      .addCase(applyJob.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applySuccess = true;
        // Add application to history list
        state.applications.unshift(action.payload.application);
        // Set job applied state
        const jobIndex = state.jobs.findIndex(
          (j) => j._id === action.payload.jobId,
        );
        if (jobIndex !== -1) {
          state.jobs[jobIndex].hasApplied = true;
          state.jobs[jobIndex].applicationStatus =
            action.payload.application.status;
        }
      })
      .addCase(applyJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.applySuccess = false;
      })
      // Fetch Student Applications
      .addCase(fetchStudentApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.applications = action.payload;
      })
      .addCase(fetchStudentApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearPlacementError,
  resetApplySuccess,
  updateApplicationInState,
} = placementSlice.actions;

export default placementSlice.reducer;
