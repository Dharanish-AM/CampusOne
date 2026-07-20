import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LISTINGS_CACHE_KEY = "campusone:lostfound:listings";

// ── Thunk: fetchLostFoundItems ───────────────────────────────────────────────
export const fetchLostFoundItems = createAsyncThunk(
  "lostFound/fetchItems",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/lost-found", { params });
      const listings = response.data.data;

      // Cache the full directory listing under standard conditions
      if (!params.q && (!params.category || params.category === "all") && !params.type) {
        try {
          await AsyncStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify(listings));
        } catch (cacheErr) {
          console.warn("Failed to write Lost & Found cache:", cacheErr.message);
        }
      }

      return listings;
    } catch (error) {
      try {
        const cachedListings = await AsyncStorage.getItem(LISTINGS_CACHE_KEY);
        if (cachedListings) {
          console.log("Loading offline Lost & Found listings from cache...");
          return JSON.parse(cachedListings);
        }
      } catch (cacheErr) {
        console.warn("Failed to read Lost & Found cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch Lost & Found listings"
      );
    }
  }
);

// ── Thunk: reportLostFoundItem ───────────────────────────────────────────────
export const reportLostFoundItem = createAsyncThunk(
  "lostFound/createItem",
  async (itemData, { rejectWithValue }) => {
    try {
      const response = await api.post("/lost-found", itemData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to submit lost/found report"
      );
    }
  }
);

// ── Thunk: updateLostFoundStatus ─────────────────────────────────────────────
export const updateLostFoundStatus = createAsyncThunk(
  "lostFound/updateStatus",
  async ({ itemId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/lost-found/${itemId}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update item status"
      );
    }
  }
);

// ── Thunk: fetchMyListings ───────────────────────────────────────────────────
export const fetchMyListings = createAsyncThunk(
  "lostFound/fetchMyItems",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/lost-found/my-listings");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch user listings"
      );
    }
  }
);

const initialState = {
  listings: [],
  myListings: [],
  isLoading: false,
  submitting: false,
  error: null,
};

const lostFoundSlice = createSlice({
  name: "lostFound",
  initialState,
  reducers: {
    clearLostFoundErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch listings
      .addCase(fetchLostFoundItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLostFoundItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.listings = action.payload;
      })
      .addCase(fetchLostFoundItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create item listing
      .addCase(reportLostFoundItem.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(reportLostFoundItem.fulfilled, (state, action) => {
        state.submitting = false;
        state.listings.unshift(action.payload);
        state.myListings.unshift(action.payload);
      })
      .addCase(reportLostFoundItem.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Update item status
      .addCase(updateLostFoundStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateLostFoundStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedItem = action.payload;
        
        // Update in listings feed
        state.listings = state.listings.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        );

        // Update in my listings history
        state.myListings = state.myListings.map((item) =>
          item._id === updatedItem._id ? updatedItem : item
        );
      })
      .addCase(updateLostFoundStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch my items listings
      .addCase(fetchMyListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myListings = action.payload;
      })
      .addCase(fetchMyListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLostFoundErrors } = lostFoundSlice.actions;

export default lostFoundSlice.reducer;
