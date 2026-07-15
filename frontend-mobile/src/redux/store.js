import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import attendanceReducer from "./slices/attendanceSlice";
import timetableReducer from "./slices/timetableSlice";
import busReducer from "./slices/busSlice";
import leaderboardReducer from "./slices/leaderboardSlice";
import chatReducer from "./slices/chatSlice";
import dashboardReducer from "./slices/dashboardSlice";
import complaintReducer from "./slices/complaintSlice";
import placementReducer from "./slices/placementSlice";
import hostelReducer from "./slices/hostelSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    timetable: timetableReducer,
    bus: busReducer,
    leaderboard: leaderboardReducer,
    chat: chatReducer,
    dashboard: dashboardReducer,
    complaint: complaintReducer,
    placement: placementReducer,
    hostel: hostelReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off for simpler handling of complex payloads if needed
    }),
});

export default store;
