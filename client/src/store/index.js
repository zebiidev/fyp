import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import areaRiderReducer from './slices/areaRiderSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        rides: rideReducer,
        chat: chatReducer,
        notifications: notificationReducer,
        areaRiders: areaRiderReducer
    }
});

export default store;
