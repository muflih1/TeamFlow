import {io, type Socket} from 'socket.io-client';

let _socket: Socket | null = null;

export function getSocket() {
  if (!_socket) {
    _socket = io(import.meta.env.VITE_APP_SERVER_URL, {
      autoConnect: false,
    });
  }
  return _socket;
}
