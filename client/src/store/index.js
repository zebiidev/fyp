import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import rideReducer from './slices/rideSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        rides: rideReducer,
        chat: chatReducer,
        notifications: notificationReducer
    }
});

export default store;
