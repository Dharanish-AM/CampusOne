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
import libraryReducer from "./slices/librarySlice";
import feesReducer from "./slices/feeSlice";
import cafeteriaReducer from "./slices/cafeteriaSlice";
import marketplaceReducer from "./slices/marketplaceSlice";
import clubReducer from "./slices/clubSlice";
import alumniReducer from "./slices/alumniSlice";
import studentIdReducer from "./slices/studentIdSlice";
import lostFoundReducer from "./slices/lostFoundSlice";
import healthReducer from "./slices/healthSlice";

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
    library: libraryReducer,
    fees: feesReducer,
    cafeteria: cafeteriaReducer,
    marketplace: marketplaceReducer,
    clubs: clubReducer,
    alumni: alumniReducer,
    studentId: studentIdReducer,
    lostFound: lostFoundReducer,
    health: healthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Turn off for simpler handling of complex payloads if needed
    }),
});

export default store;
