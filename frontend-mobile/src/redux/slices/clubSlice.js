import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLUBS_CACHE_KEY = "campusone:clubs:list";
const EVENTS_CACHE_KEY = "campusone:clubs:events";

// ── Thunk: fetchClubs ────────────────────────────────────────────────────────
export const fetchClubs = createAsyncThunk(
  "clubs/fetchClubs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/clubs");
      const clubs = response.data.data;

      try {
        await AsyncStorage.setItem(CLUBS_CACHE_KEY, JSON.stringify(clubs));
      } catch (cacheErr) {
        console.warn("Failed to write clubs cache:", cacheErr.message);
      }

      return clubs;
    } catch (error) {
      try {
        const cachedClubs = await AsyncStorage.getItem(CLUBS_CACHE_KEY);
        if (cachedClubs) {
          console.log("Loading offline clubs directory from cache...");
          return JSON.parse(cachedClubs);
        }
      } catch (cacheErr) {
        console.warn("Failed to read clubs cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch clubs"
      );
    }
  }
);

// ── Thunk: toggleClubMembership ──────────────────────────────────────────────
export const toggleClubMembership = createAsyncThunk(
  "clubs/toggleMembership",
  async (clubId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/clubs/${clubId}/join`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to toggle club membership"
      );
    }
  }
);

// ── Thunk: fetchUpcomingEvents ───────────────────────────────────────────────
export const fetchUpcomingEvents = createAsyncThunk(
  "clubs/fetchEvents",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/clubs/events");
      const events = response.data.data;

      try {
        await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
      } catch (cacheErr) {
        console.warn("Failed to write events cache:", cacheErr.message);
      }

      return events;
    } catch (error) {
      try {
        const cachedEvents = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
        if (cachedEvents) {
          console.log("Loading offline upcoming events from cache...");
          return JSON.parse(cachedEvents);
        }
      } catch (cacheErr) {
        console.warn("Failed to read events cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch events"
      );
    }
  }
);

// ── Thunk: toggleEventRsvp ───────────────────────────────────────────────────
export const toggleEventRsvp = createAsyncThunk(
  "clubs/toggleRsvp",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/clubs/events/${eventId}/rsvp`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update RSVP"
      );
    }
  }
);

// ── Thunk: postClubEvent ─────────────────────────────────────────────────────
export const postClubEvent = createAsyncThunk(
  "clubs/postEvent",
  async ({ clubId, eventData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/clubs/${clubId}/events`, eventData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to post event"
      );
    }
  }
);

const initialState = {
  clubs: [],
  events: [],
  isLoading: false,
  submitting: false,
  error: null,
};

const clubSlice = createSlice({
  name: "clubs",
  initialState,
  reducers: {
    clearClubErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Clubs
      .addCase(fetchClubs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClubs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clubs = action.payload;
      })
      .addCase(fetchClubs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Toggle Membership
      .addCase(toggleClubMembership.fulfilled, (state, action) => {
        const updatedClub = action.payload;
        const index = state.clubs.findIndex((club) => club._id === updatedClub._id);
        if (index !== -1) {
          state.clubs[index] = updatedClub;
        }
      })

      // Fetch Events
      .addCase(fetchUpcomingEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchUpcomingEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Toggle RSVP
      .addCase(toggleEventRsvp.fulfilled, (state, action) => {
        const updatedEvent = action.payload;
        const index = state.events.findIndex((ev) => ev._id === updatedEvent._id);
        if (index !== -1) {
          state.events[index] = updatedEvent;
        }
      })

      // Post Club Event
      .addCase(postClubEvent.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(postClubEvent.fulfilled, (state, action) => {
        state.submitting = false;
        state.events.push(action.payload);
        // Sort events chronologically
        state.events.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
      })
      .addCase(postClubEvent.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      });
  },
});

export const { clearClubErrors } = clubSlice.actions;

export default clubSlice.reducer;
