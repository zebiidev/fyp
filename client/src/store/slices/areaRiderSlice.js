import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchAreaRiders = createAsyncThunk(
    'areaRiders/fetchAreaRiders',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/auth/riders-from-area');
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to load riders from your area');
        }
    }
);

const initialState = {
    riders: [],
    passengerArea: '',
    passengerAddress: '',
    loading: false,
    error: null
};

const areaRiderSlice = createSlice({
    name: 'areaRiders',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAreaRiders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAreaRiders.fulfilled, (state, action) => {
                state.loading = false;
                state.riders = action.payload.riders || [];
                state.passengerArea = action.payload.passengerArea || '';
                state.passengerAddress = action.payload.passengerAddress || '';
            })
            .addCase(fetchAreaRiders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.riders = [];
            });
    }
});

export default areaRiderSlice.reducer;
