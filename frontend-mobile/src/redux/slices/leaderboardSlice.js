import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// ─────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────

export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetchLeaderboard',
  async ({ page = 1, limit = 50 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/leaderboard?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch leaderboard';
      return rejectWithValue(message);
    }
  }
);

export const updateCodingHandles = createAsyncThunk(
  'leaderboard/updateCodingHandles',
  async (handles, { rejectWithValue }) => {
    try {
      const response = await api.patch('/leaderboard/handles', handles);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to update handles';
      return rejectWithValue(message);
    }
  }
);

// ─────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────

const initialState = {
  entries: [],
  totalCount: 0,
  page: 1,
  totalPages: 1,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  myHandles: { leetcode: null, codeforces: null, github: null },
  handlesStatus: 'idle',
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearLeaderboardError: (state) => {
      state.error = null;
    },
    setMyHandles: (state, action) => {
      state.myHandles = { ...state.myHandles, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.entries = action.payload.entries;
        state.totalCount = action.payload.totalCount;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Update Coding Handles
      .addCase(updateCodingHandles.pending, (state) => {
        state.handlesStatus = 'loading';
      })
      .addCase(updateCodingHandles.fulfilled, (state, action) => {
        state.handlesStatus = 'succeeded';
        state.myHandles = action.payload.codingHandles;
      })
      .addCase(updateCodingHandles.rejected, (state, action) => {
        state.handlesStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearLeaderboardError, setMyHandles } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
