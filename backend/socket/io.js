import { Server } from "socket.io";

export function createIo(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    transports: ['polling', 'websocket'],
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      console.log("🔌 Socket connection attempt from:", origin);
      callback(null, true);
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    //// ...add your socket event handlers here...
  });

  return io;
}

export default createIo;

