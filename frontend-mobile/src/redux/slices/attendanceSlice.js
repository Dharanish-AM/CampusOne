import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchAttendance',
  async (studentId, { rejectWithValue }) => {
    try {
      const url = studentId ? `/attendance/student?studentId=${studentId}` : '/attendance/student';
      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch attendance';
      return rejectWithValue(message);
    }
  }
);

export const markStudentAttendance = createAsyncThunk(
  'attendance/markStudentAttendance',
  async (attendancePayload, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance', attendancePayload);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to mark attendance';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  attendanceData: null,
  isLoading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError: (state) => {
      state.error = null;
    },
    // Handler to process real-time socket updates directly into the state
    handleSocketAttendanceUpdate: (state, action) => {
      if (!state.attendanceData) return;

      const { status, date, subject } = action.payload;

      // Append log to chronological history logs list
      state.attendanceData.logs.unshift({
        id: `socket_${Date.now()}`,
        date,
        status,
        subjectCode: subject.code,
        subjectName: subject.name,
      });

      // Update subject aggregates
      const targetSub = state.attendanceData.subjects.find((s) => s.subject.id === subject.id);
      if (targetSub) {
        if (status === 'present') {
          targetSub.present += 1;
          targetSub.total += 1;
          state.attendanceData.totalPresent += 1;
          state.attendanceData.totalClasses += 1;
        } else if (status === 'absent') {
          targetSub.absent += 1;
          targetSub.total += 1;
          state.attendanceData.totalClasses += 1;
        }

        // Recompute subject percentage & shortage predictions
        const { present, total } = targetSub;
        const newPct = total > 0 ? (present / total) * 100 : 100;
        targetSub.percentage = Number(newPct.toFixed(1));

        if (newPct < 75) {
          const classesNeeded = Math.ceil(3 * total - 4 * present);
          targetSub.prediction = {
            status: 'danger',
            message: `Must attend next ${classesNeeded} consecutive class${classesNeeded > 1 ? 'es' : ''} to reach 75%`,
            value: classesNeeded,
          };
        } else {
          const classesCanMiss = Math.max(0, Math.floor((4 * present - 3 * total) / 3));
          targetSub.prediction = {
            status: 'safe',
            message: classesCanMiss > 0 
              ? `Can afford to miss next ${classesCanMiss} class${classesCanMiss > 1 ? 'es' : ''} safely`
              : `Borderline attendance: Can't afford to miss the next class`,
            value: classesCanMiss,
          };
        }
      }

      // Recompute overall percentage
      const totalP = state.attendanceData.totalPresent;
      const totalC = state.attendanceData.totalClasses;
      state.attendanceData.overallPercentage = totalC > 0 ? Number(((totalP / totalC) * 100).toFixed(1)) : 100;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Attendance
      .addCase(fetchAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendanceData = action.payload;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Mark Attendance
      .addCase(markStudentAttendance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markStudentAttendance.fulfilled, (state) => {
        state.isLoading = false;
        // The calling component will trigger a reload or wait for socket update
      })
      .addCase(markStudentAttendance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceError, handleSocketAttendanceUpdate } = attendanceSlice.actions;
export default attendanceSlice.reducer;
