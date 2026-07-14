import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Base API URL - pointing to local machine default server port
// Note: When running on Android Emulator, localhost maps to 10.0.2.2.
// For iOS Simulator, localhost works. For Expo Go physical devices, use LAN IP.
const API_URL = "http://192.168.0.109:5000/api/auth";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/register`, userData);
      const { user, profile, accessToken, refreshToken } = response.data.data;

      // Persist in AsyncStorage
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      if (profile) {
        await AsyncStorage.setItem("profile", JSON.stringify(profile));
      }

      return { user, profile, accessToken, refreshToken };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      return rejectWithValue(message);
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      const { user, profile, accessToken, refreshToken } = response.data.data;

      // Persist in AsyncStorage
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      if (profile) {
        await AsyncStorage.setItem("profile", JSON.stringify(profile));
      }

      return { user, profile, accessToken, refreshToken };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      // Clear server session if token is available
      if (token) {
        await axios.post(
          `${API_URL}/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
    } catch (error) {
      // Even if network request fails, clear local credentials
      console.warn("Logout server request failed:", error.message);
    } finally {
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        "accessToken",
        "refreshToken",
        "user",
        "profile",
      ]);
    }
  },
);

export const loadStoredAuth = createAsyncThunk(
  "auth/loadStoredAuth",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const userStr = await AsyncStorage.getItem("user");
      const profileStr = await AsyncStorage.getItem("profile");

      if (accessToken && refreshToken && userStr) {
        return {
          accessToken,
          refreshToken,
          user: JSON.parse(userStr),
          profile: profileStr ? JSON.parse(profileStr) : null,
        };
      }
      return null;
    } catch (error) {
      return rejectWithValue("Failed to load local auth credentials");
    }
  },
);

const initialState = {
  user: null,
  profile: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTokens: (state, action) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return {
          ...initialState,
          isLoading: false,
        };
      })
      .addCase(logoutUser.rejected, (state) => {
        return {
          ...initialState,
          isLoading: false,
        };
      })

      // Load Stored Auth
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.profile = action.payload.profile;
          state.token = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateTokens } = authSlice.actions;
export default authSlice.reducer;
