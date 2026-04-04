import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const fetchConversations = createAsyncThunk(
    'chat/fetchConversations',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/chat/conversations');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch conversations');
        }
    }
);

export const fetchChatHistory = createAsyncThunk(
    'chat/fetchHistory',
    async (userId, { rejectWithValue }) => {
        try {
            const res = await api.get(`/chat/${userId}`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch chat history');
        }
    }
);

const initialState = {
    conversations: [],
    activeConversation: null, // Messages with a specific user
    messages: [],
    loading: false,
    error: null
};

const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        removeMessage: (state, action) => {
            state.messages = state.messages.filter((msg) => msg._id !== action.payload);
        },
        clearChatErrors: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Conversations
            .addCase(fetchConversations.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.loading = false;
                state.conversations = action.payload;
            })
            .addCase(fetchConversations.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch History
            .addCase(fetchChatHistory.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchChatHistory.fulfilled, (state, action) => {
                state.loading = false;
                state.messages = action.payload;
            })
            .addCase(fetchChatHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { addMessage, removeMessage, clearChatErrors } = chatSlice.actions;
export default chatSlice.reducer;
