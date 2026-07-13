import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.0.109:5000/api/chat';

// ── Helper: build Authorization headers ──────────────────────────────────────
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  return { Authorization: `Bearer ${token}` };
};

// ── Thunk: sendMessage ────────────────────────────────────────────────────────
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, conversationId }, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const body = { message };
      if (conversationId) body.conversationId = conversationId;

      const response = await axios.post(API_URL, body, { headers });
      return response.data.data; // { reply, conversationId }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send message';
      return rejectWithValue(message);
    }
  }
);

// ── Thunk: loadHistory ────────────────────────────────────────────────────────
export const loadHistory = createAsyncThunk(
  'chat/loadHistory',
  async (conversationId, { rejectWithValue }) => {
    try {
      const headers = await getAuthHeaders();
      const params = conversationId ? { conversationId } : {};
      const response = await axios.get(`${API_URL}/history`, { headers, params });
      return response.data.data; // Array of { role, content, createdAt }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load history';
      return rejectWithValue(message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],       // [{ id, role, content, timestamp }]
    status: 'idle',     // 'idle' | 'loading' | 'failed'
    conversationId: null,
    error: null,
  },
  reducers: {
    clearChat(state) {
      state.messages = [];
      state.conversationId = null;
      state.status = 'idle';
      state.error = null;
    },
    clearChatError(state) {
      state.error = null;
      state.status = 'idle';
    },
    // Optimistic user message added before the API call completes
    addOptimisticMessage(state, action) {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // sendMessage
    builder
      .addCase(sendMessage.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.status = 'idle';
        const { reply, conversationId } = action.payload;
        state.conversationId = conversationId;
        // Append assistant reply
        state.messages.push({
          id: `${Date.now()}_assistant`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        // Remove the optimistic user message on failure
        state.messages = state.messages.filter((m) => !m.optimistic);
      });

    // loadHistory
    builder
      .addCase(loadHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.status = 'idle';
        state.messages = action.payload.map((h, idx) => ({
          id: `${h.createdAt}_${idx}`,
          role: h.role,
          content: h.content,
          timestamp: h.createdAt,
        }));
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearChat, clearChatError, addOptimisticMessage } = chatSlice.actions;
export default chatSlice.reducer;
