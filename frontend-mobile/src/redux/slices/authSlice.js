import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import api, { SOCKET_URL } from "../../utils/api";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/register", userData);
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
      const response = await api.post("/auth/login", credentials);
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
  async (_, { rejectWithValue }) => {
    try {
      // Use a raw axios instance (not the intercepted `api`) so this call
      // can never itself trigger a 401 intercept cycle and re-dispatch logoutUser.
      const accessToken = await AsyncStorage.getItem("accessToken");
      await axios.post(
        `${SOCKET_URL}/api/auth/logout`,
        {},
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
          timeout: 5000,
        },
      );
    } catch (error) {
      // Even if the server request fails, always clear local credentials
      console.warn("Logout server request failed:", error.message);
    } finally {
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

export const updateAuthProfile = createAsyncThunk(
  "auth/updateAuthProfile",
  async (profileUpdates, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentProfile = state.auth.profile;
      const updatedProfile = { ...currentProfile, ...profileUpdates };
      await AsyncStorage.setItem("profile", JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to update profile locally",
      );
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
      })
      .addCase(updateAuthProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export const { clearError, updateTokens } = authSlice.actions;
export default authSlice.reducer;
