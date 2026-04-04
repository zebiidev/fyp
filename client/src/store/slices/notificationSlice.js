import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/notifications');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
        }
    }
);

export const markRead = createAsyncThunk(
    'notifications/markRead',
    async (id, { rejectWithValue }) => {
        try {
            const res = await api.put(`/notifications/${id}/read`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to mark as read');
        }
    }
);

export const markAllRead = createAsyncThunk(
    'notifications/markAllRead',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.put('/notifications/read-all');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        unreadCount: 0,
        loading: false,
        error: null
    },
    reducers: {
        addNotification: (state, action) => {
            const incoming = action.payload;
            if (incoming?._id && state.items.some((n) => n._id === incoming._id)) {
                return;
            }
            state.items.unshift(action.payload);
            if (!action.payload?.read) {
                state.unreadCount += 1;
            }
        },
        resetNotifications: (state) => {
            state.items = [];
            state.unreadCount = 0;
            state.loading = false;
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.notifications;
                state.unreadCount = action.payload.unreadCount;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(markRead.fulfilled, (state, action) => {
                const index = state.items.findIndex(n => n._id === action.payload._id);
                if (index !== -1 && !state.items[index].read) {
                    state.items[index].read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            .addCase(markAllRead.fulfilled, (state) => {
                state.items.forEach(n => n.read = true);
                state.unreadCount = 0;
            });
    }
});

export const { addNotification, resetNotifications, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;
