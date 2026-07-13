import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL Configuration
// - 10.0.2.2:5000 maps to localhost from the Android Emulator
// - 127.0.0.1:5000 / localhost works for the iOS Simulator
// - To use a physical device, replace with your local machine's IP (e.g., 192.168.x.x)
const API_BASE_URL = 'http://10.0.2.2:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to track the refresh token request state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach access token from AsyncStorage to every outgoing request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Failed to read accessToken from AsyncStorage:', err.message);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle auth token renewals and connection errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is due to a network connection failure
    if (!error.response) {
      console.warn('Network Error / Offline:', error.message);
      // Construct a unified error object for connection timeouts
      return Promise.reject(
        new Error('Network connection issues detected. Please check your connectivity.')
      );
    }

    // Intercept 401 Unauthorized (Expired Access Token)
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Dynamically import store and actions only when a 401 occurs.
      // This completely breaks the circular dependency at module initialization time.
      const { store } = require('../redux/store');
      const { updateTokens, logoutUser } = require('../redux/slices/authSlice');

      try {
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token found locally.');
        }

        // Call the refresh endpoint using a fresh axios instance to avoid loops
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Persist new credentials
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        // Update Redux state
        store.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));

        // Process queue
        processQueue(null, accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Force logout if refresh fails
        store.dispatch(logoutUser());
        return Promise.reject(
          new Error('Session expired. Please log in again to access the application.')
        );
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
