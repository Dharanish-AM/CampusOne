import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import attendanceReducer from './slices/attendanceSlice';
import timetableReducer from './slices/timetableSlice';
import busReducer from './slices/busSlice';
import leaderboardReducer from './slices/leaderboardSlice';
import chatReducer from './slices/chatSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    timetable: timetableReducer,
    bus: busReducer,
    leaderboard: leaderboardReducer,
    chat: chatReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off for simpler handling of complex payloads if needed
    }),
});

export default store;
