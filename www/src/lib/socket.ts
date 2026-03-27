import {io, type Socket} from 'socket.io-client';

let _socket: Socket | null = null;

export function getSocket() {
  if (!_socket) {
    _socket = io('http://localhost:8080', {
      autoConnect: false,
    });
  }
  return _socket;
}
