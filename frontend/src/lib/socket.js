import { io } from "socket.io-client";

const socket = io(process.env.NODE_ENV === 'production' 
  ? 'https://typex-jygr.onrender.com' 
  : 'http://localhost:5000', {
  withCredentials: true,
  transports: ['polling', 'websocket']
});

export default socket;



