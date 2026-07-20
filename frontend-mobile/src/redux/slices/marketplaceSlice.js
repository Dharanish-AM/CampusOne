import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CATALOG_CACHE_KEY = "campusone:marketplace:catalog";

// ── Thunk: fetchMarketplaceProducts ──────────────────────────────────────────
export const fetchMarketplaceProducts = createAsyncThunk(
  "marketplace/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/marketplace/products", { params });
      const products = response.data.data;

      // Save catalog to AsyncStorage cache if no filters applied
      if (!params.q && (!params.category || params.category === "all")) {
        try {
          await AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(products));
        } catch (cacheErr) {
          console.warn("Failed to write marketplace cache:", cacheErr.message);
        }
      }

      return products;
    } catch (error) {
      // Offline fallback: load from AsyncStorage if network fails
      try {
        const cachedProducts = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
        if (cachedProducts) {
          console.log("Loading offline marketplace catalog from cache...");
          return JSON.parse(cachedProducts);
        }
      } catch (cacheErr) {
        console.warn("Failed to read marketplace cache:", cacheErr.message);
      }

      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch products"
      );
    }
  }
);

// ── Thunk: postMarketplaceListing ────────────────────────────────────────────
export const postMarketplaceListing = createAsyncThunk(
  "marketplace/postListing",
  async (listingData, { rejectWithValue }) => {
    try {
      const response = await api.post("/marketplace/product", listingData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to post listing"
      );
    }
  }
);

// ── Thunk: fetchStudentListings ──────────────────────────────────────────────
export const fetchStudentListings = createAsyncThunk(
  "marketplace/fetchMyListings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/marketplace/my-listings");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch your listings"
      );
    }
  }
);

// ── Thunk: updateListingStatus ───────────────────────────────────────────────
export const updateListingStatus = createAsyncThunk(
  "marketplace/updateStatus",
  async ({ productId, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/marketplace/product/${productId}/status`, { status });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to update status"
      );
    }
  }
);

const initialState = {
  products: [],
  myListings: [],
  isLoading: false,
  submitting: false,
  error: null,
};

const marketplaceSlice = createSlice({
  name: "marketplace",
  initialState,
  reducers: {
    clearMarketplaceErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products Catalog
      .addCase(fetchMarketplaceProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMarketplaceProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
      })
      .addCase(fetchMarketplaceProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Post New Listing
      .addCase(postMarketplaceListing.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(postMarketplaceListing.fulfilled, (state, action) => {
        state.submitting = false;
        state.myListings.unshift(action.payload);
      })
      .addCase(postMarketplaceListing.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })

      // Fetch User's Listings
      .addCase(fetchStudentListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myListings = action.payload;
      })
      .addCase(fetchStudentListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Listing Status
      .addCase(updateListingStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        // Update in myListings
        const myIndex = state.myListings.findIndex((item) => item._id === updated._id);
        if (myIndex !== -1) {
          state.myListings[myIndex] = updated;
        }
        // Update/Remove in products catalog based on status
        if (updated.status === "sold") {
          state.products = state.products.filter((item) => item._id !== updated._id);
        } else {
          // If marked back to available, insert or update
          const prodIndex = state.products.findIndex((item) => item._id === updated._id);
          if (prodIndex !== -1) {
            state.products[prodIndex] = updated;
          } else {
            state.products.unshift(updated);
          }
        }
      });
  },
});

export const { clearMarketplaceErrors } = marketplaceSlice.actions;

export default marketplaceSlice.reducer;
