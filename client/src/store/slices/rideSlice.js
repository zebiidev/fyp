import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const createRide = createAsyncThunk(
    'rides/create',
    async (rideData, { rejectWithValue }) => {
        try {
            const res = await api.post('/rides', rideData);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to create ride');
        }
    }
);

export const searchRides = createAsyncThunk(
    'rides/search',
    async (searchParams, { rejectWithValue }) => {
        try {
            const { from, to, date, useProfileArea } = searchParams;
            const params = new URLSearchParams();
            const fromValue = typeof from === 'string' ? from.trim() : '';
            const toValue = typeof to === 'string' ? to.trim() : '';
            if (fromValue) params.append('from', fromValue);
            if (toValue) params.append('to', toValue);
            if (date) params.append('date', date);
            if (useProfileArea) params.append('useProfileArea', 'true');
            const query = params.toString();
            const res = await api.get(`/rides${query ? `?${query}` : ''}`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to search rides');
        }
    }
);

export const fetchMyRides = createAsyncThunk(
    'rides/fetchMyRides',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/rides/my');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch my rides');
        }
    }
);

export const joinRide = createAsyncThunk(
    'rides/join',
    async ({ rideId }, { rejectWithValue }) => {
        try {
            const res = await api.post(`/rides/${rideId}/join`);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to join ride');
        }
    }
);

export const updatePassengerStatus = createAsyncThunk(
    'rides/updatePassengerStatus',
    async ({ rideId, passengerId, status }, { rejectWithValue }) => {
        try {
            const res = await api.put(`/rides/${rideId}/passengers/${passengerId}/status`, { status });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update passenger status');
        }
    }
);

export const updateRideStatus = createAsyncThunk(
    'rides/updateRideStatus',
    async ({ rideId, status }, { rejectWithValue }) => {
        try {
            const res = await api.put(`/rides/${rideId}/status`, { status });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update ride status');
        }
    }
);

export const rateRide = createAsyncThunk(
    'rides/rateRide',
    async ({ rideId, rating }, { rejectWithValue }) => {
        try {
            const res = await api.post(`/rides/${rideId}/rate`, { rating });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to submit rating');
        }
    }
);

const initialState = {
    rides: [], // Search results
    myRides: [], // User's rides (as driver or passenger)
    currentRide: null,
    loading: false,
    error: null,
    success: false // For simple success notifications
};

const rideSlice = createSlice({
    name: 'rides',
    initialState,
    reducers: {
        clearRideErrors: (state) => {
            state.error = null;
        },
        resetRideSuccess: (state) => {
            state.success = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Ride
            .addCase(createRide.pending, (state) => {
                state.loading = true;
            })
            .addCase(createRide.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.myRides.push(action.payload);
            })
            .addCase(createRide.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Search Rides
            .addCase(searchRides.pending, (state) => {
                state.loading = true;
            })
            .addCase(searchRides.fulfilled, (state, action) => {
                state.loading = false;
                state.rides = action.payload;
            })
            .addCase(searchRides.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch My Rides
            .addCase(fetchMyRides.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMyRides.fulfilled, (state, action) => {
                state.loading = false;
                state.myRides = action.payload;
            })
            .addCase(fetchMyRides.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Join Ride
            .addCase(joinRide.pending, (state) => {
                state.loading = true;
            })
            .addCase(joinRide.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Optionally update local state if needed
            })
            .addCase(joinRide.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Passenger Status
            .addCase(updatePassengerStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(updatePassengerStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                // Update the specific ride in myRides
                const index = state.myRides.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.myRides[index] = action.payload;
                }
            })
            .addCase(updatePassengerStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Ride Status
            .addCase(updateRideStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateRideStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.myRides.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.myRides[index] = action.payload;
                }
            })
            .addCase(updateRideStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Rate Ride
            .addCase(rateRide.pending, (state) => {
                state.loading = true;
            })
            .addCase(rateRide.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                const index = state.myRides.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.myRides[index] = action.payload;
                }
            })
            .addCase(rateRide.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearRideErrors, resetRideSuccess } = rideSlice.actions;
export default rideSlice.reducer;
