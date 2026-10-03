import { io, Socket } from 'socket.io-client';

// Shared socket instance
// Connecting to the same origin where the Node server is hosted
export const socket: Socket = io('/', {
  autoConnect: false, // We'll connect manually when logged in
});
