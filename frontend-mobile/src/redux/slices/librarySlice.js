import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/api";

// Thunks
export const searchLibraryBooks = createAsyncThunk(
  "library/searchBooks",
  async (queryParams, { rejectWithValue }) => {
    try {
      const response = await api.get("/library/books", { params: queryParams });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search library catalog",
      );
    }
  },
);

export const fetchStudentBorrows = createAsyncThunk(
  "library/fetchStudentBorrows",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/library/student");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch borrowing records",
      );
    }
  },
);

const initialState = {
  books: [],
  borrows: [],
  totalUnpaidFine: 0,
  loading: false,
  error: null,
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    clearLibraryErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search books
      .addCase(searchLibraryBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchLibraryBooks.fulfilled, (state, action) => {
        state.loading = false;
        state.books = action.payload.data;
      })
      .addCase(searchLibraryBooks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch student borrows
      .addCase(fetchStudentBorrows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudentBorrows.fulfilled, (state, action) => {
        state.loading = false;
        state.borrows = action.payload.data.borrows;
        state.totalUnpaidFine = action.payload.data.totalUnpaidFine;
      })
      .addCase(fetchStudentBorrows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLibraryErrors } = librarySlice.actions;
export default librarySlice.reducer;
