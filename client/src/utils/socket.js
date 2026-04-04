import { io } from 'socket.io-client';
import { SOCKET_BASE_URL } from './api';

let socket;
let socketToken;

export const getSocket = (token) => {
    if (!token) {
        return null;
    }

    // Recreate socket when auth token changes (logout/login as another user).
    if (socket && socketToken !== token) {
        socket.disconnect();
        socket = null;
        socketToken = null;
    }

    if (!socket) {
        socket = io(SOCKET_BASE_URL, {
            auth: { token },
            transports: ['websocket']
        });
        socketToken = token;
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
    socket = null;
    socketToken = null;
};
