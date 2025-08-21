import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Redis from "ioredis";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/room.js";
import User from "./models/User.js";
import Room from "./models/Room.js";
import cookieParser from "cookie-parser";

const playersMap = new Map()

dotenv.config();
connectDB();

const app = express();

// FIXED: More robust CORS configuration for deployment
const allowedOrigins = [
  "https://itypex.onrender.com",
  "https://wetype-ayft.onrender.com",
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_URL
].filter(Boolean);

console.log("🌐 Allowed origins:", allowedOrigins);

// FIXED: Single comprehensive CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn("❌ CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["set-cookie"]
}));

// FIXED: Explicit OPTIONS handling for preflight
app.options("*", cors());

// Body parsing middleware
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enhanced middleware for request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.get('origin')}`);
  next();
});

// FIXED: Add health check at root for Render
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "TypeX Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Enhanced health check
app.get("/api/health", (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    cors: allowedOrigins
  });
});

const server = http.createServer(app);

// FIXED: More robust Socket.IO CORS configuration
const io = new Server(server, {
  cors: { 
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  transports: ['polling', 'websocket'], // FIXED: Ensure both transports work
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    console.log("🔌 Socket connection attempt from:", origin);
    callback(null, true);
  }
});

// FIXED: Improved Redis connection with better error handling
let redisClient = null;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
      console.log('Falling back to in-memory storage');
      redisClient = null;
    });
  } catch (error) {
    console.warn('Redis setup failed:', error.message);
    console.log('Using in-memory storage');
    redisClient = null;
  }
} else {
  console.log('📝 Using in-memory storage (development mode)');
}

// Fixed Game state management class
class GameStateManager {
  constructor() {
    this.inMemoryState = {
      rooms: new Map(),
      hosts: new Map(),
      timers: new Map(),
      gameStates: new Map()
    };
  }

  // Helper method to convert Map to object for Redis storage
  _mapToObject(map) {
    if (!map || !(map instanceof Map)) return {};
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  // Helper method to convert object back to Map from Redis
  _objectToMap(obj) {
    if (!obj || typeof obj !== 'object') return new Map();
    const map = new Map();
    for (const [key, value] of Object.entries(obj)) {
      map.set(key, value);
    }
    return map;
  }

  async setRoomPlayers(roomId, players) {
    const key = `room:${roomId}:players`;
    if (redisClient) {
      try {
        // Convert Map to plain object for Redis storage
        const playersObject = this._mapToObject(players);
        await redisClient.setex(key, 3600, JSON.stringify(playersObject));
      } catch (err) {
        console.warn('Redis write error:', err.message);
        this.inMemoryState.rooms.set(roomId, players);
      }
    } else {
      this.inMemoryState.rooms.set(roomId, players);
    }
  }

  async getRoomPlayers(roomId) {
    const key = `room:${roomId}:players`;
    if (redisClient) {
      try {
        const data = await redisClient.get(key);
        if (data) {
          // Convert object back to Map
          const playersObject = JSON.parse(data);
          return this._objectToMap(playersObject);
        }
        return new Map();
      } catch (err) {
        console.warn('Redis read error:', err.message);
        return this.inMemoryState.rooms.get(roomId) || new Map();
      }
    } else {
      return this.inMemoryState.rooms.get(roomId) || new Map();
    }
  }

  async setRoomHost(roomId, hostId) {
    const key = `room:${roomId}:host`;
    if (redisClient) {
      try {
        await redisClient.setex(key, 3600, hostId);
      } catch (err) {
        console.warn('Redis write error:', err.message);
        this.inMemoryState.hosts.set(roomId, hostId);
      }
    } else {
      this.inMemoryState.hosts.set(roomId, hostId);
    }
  }

  async getRoomHost(roomId) {
    const key = `room:${roomId}:host`;
    if (redisClient) {
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.warn('Redis read error:', err.message);
        return this.inMemoryState.hosts.get(roomId);
      }
    } else {
      return this.inMemoryState.hosts.get(roomId);
    }
  }

  async deleteRoom(roomId) {
    if (redisClient) {
      try {
        await redisClient.del(`room:${roomId}:players`);
        await redisClient.del(`room:${roomId}:host`);
        await redisClient.del(`room:${roomId}:gamestate`);
      } catch (err) {
        console.warn('Redis delete error:', err.message);
      }
    }
    this.inMemoryState.rooms.delete(roomId);
    this.inMemoryState.hosts.delete(roomId);
    this.inMemoryState.gameStates.delete(roomId);
  }

  setTimer(roomId, timerId) {
    this.inMemoryState.timers.set(roomId, timerId);
  }

  clearTimer(roomId) {
    const timerId = this.inMemoryState.timers.get(roomId);
    if (timerId) {
      clearTimeout(timerId);
      this.inMemoryState.timers.delete(roomId);
    }
  }
}

const gameState = new GameStateManager();

// Enhanced utility functions
const createPlayerData = (username, socketId) => ({
  id: socketId,
  username,
  wpm: 0,
  accuracy: 100,
  progress: 0,
  isTyping: false,
  joinedAt: Date.now(),
  lastUpdate: Date.now()
});

const getSortedPlayers = async (roomId) => {
  try {
    const playersMap = await gameState.getRoomPlayers(roomId);
    if (!playersMap || playersMap.size === 0) return [];
    
    // Get room information from database to determine host
    let roomFromDB = null;
    try {
      roomFromDB = await Room.findOne({ roomId }).populate('host', 'username');
    } catch (dbError) {
      console.error('Database error when getting room info:', dbError);
    }
    
    const players = Array.from(playersMap.values())
      .filter(p => p && p.username)
      .map(p => ({
        username: p.username,
        wpm: Math.max(0, p.wpm || 0),
        accuracy: Math.min(100, Math.max(0, p.accuracy || 100)),
        progress: Math.min(100, Math.max(0, p.progress || 0)),
        isTyping: p.isTyping || false,
        lastUpdate: p.lastUpdate || Date.now(),
        isHost: roomFromDB && roomFromDB.host && roomFromDB.host.username === p.username
      }))
      .sort((a, b) => {
        // Sort by progress desc, then by username
        if (b.progress !== a.progress) return b.progress - a.progress;
        return a.username.localeCompare(b.username);
      });
    
    return players;
  } catch (error) {
    console.error('Error getting sorted players:', error);
    return [];
  }
};

const resetRoomWPM = async (roomId) => {
  try {
    const playersMap = await gameState.getRoomPlayers(roomId);
    if (!playersMap || playersMap.size === 0) return;
    
    for (const [socketId, player] of playersMap.entries()) {
      playersMap.set(socketId, {
        ...player,
        wpm: 0,
        accuracy: 100,
        progress: 0,
        isTyping: false,
        lastUpdate: Date.now()
      });
    }
    
    await gameState.setRoomPlayers(roomId, playersMap);
  } catch (error) {
    console.error('Error resetting room WPM:', error);
  }
};

const setGameTimer = (roomId, duration) => {
  gameState.clearTimer(roomId);
  
  console.log(`⏰ Setting timer for room ${roomId}: ${duration}s`);
  
  const timerId = setTimeout(async () => {
    try {
      console.log(`⏰ Timer ended for room ${roomId}`);
      io.to(roomId).emit("game:stopTyping", { roomId, timestamp: Date.now() });
      gameState.clearTimer(roomId);
    } catch (error) {
      console.error('Timer callback error:', error);
    }
  }, duration * 1000);
  
  gameState.setTimer(roomId, timerId);
};

// Enhanced Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  let currentRoom = null;
  let username = null;

  // Enhanced room joining with better error handling
  socket.on("joinRoom", async ({ roomId, username: name }) => {
    try {
      console.log("🚪 Join room event received");
      console.log("Room ID:", roomId);
      console.log("Username:", name);
      console.log("Socket ID:", socket.id);
      
      currentRoom = String(roomId);
      username = name || `Guest_${socket.id.substring(0, 6)}`;
      
      console.log(`👤 ${username} joining room ${currentRoom}`);
      
      socket.join(currentRoom);
      
      // Get or create players map
      let playersMap = await gameState.getRoomPlayers(currentRoom);
      console.log("Players map before join:", playersMap);
      
      if (!(playersMap instanceof Map)) {
        playersMap = new Map();
      }
      
      // Check if room exists in database and get host information
      let roomFromDB = null;
      try {
        roomFromDB = await Room.findOne({ roomId: currentRoom });
      } catch (dbError) {
        console.error('Database error when checking room:', dbError);
      }
      
      // Set host logic: only set host if this is the first player AND room doesn't exist in DB
      if (playersMap.size === 0) {
        if (!roomFromDB) {
          // Room doesn't exist in DB, this is a new room - set current user as host
          console.log(`👑 Setting ${username} as host of new room ${currentRoom}`);
          await gameState.setRoomHost(currentRoom, socket.id);
        } else {
          // Room exists in DB, use the host from database
          console.log(`👑 Room ${currentRoom} exists in DB, host is: ${roomFromDB.host}`);
          // Note: We don't set the host here since it should be managed by the database
          // The host will be determined by checking if the current user is the room creator
        }
      }
      
      // Add player with enhanced data
      playersMap.set(socket.id, createPlayerData(username, socket.id));
      await gameState.setRoomPlayers(currentRoom, playersMap);
      
      // Broadcast updated players list
      const sortedPlayers = await getSortedPlayers(currentRoom);
      console.log("Sorted players:", sortedPlayers);
      io.to(currentRoom).emit("players:update", sortedPlayers);
      
      console.log(`✅ ${username} joined room ${currentRoom} (${sortedPlayers.length} players)`);
      
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  // Enhanced messaging with rate limiting
  socket.on("message", async ({ roomId, user, text }) => {
    try {
      if (!roomId || !text || text.length > 500) return;
      
      const sanitizedText = text.trim().substring(0, 500);
      const messageData = { 
        user: user || username || "Anonymous", 
        text: sanitizedText, 
        time: Date.now(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      io.to(String(roomId)).emit("message", messageData);
      console.log(`💬 Message in ${roomId}: ${user}: ${sanitizedText.substring(0, 50)}...`);
      
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  // Enhanced game start with validation
  socket.on("startGame", async ({ roomId, text, duration = 30 }) => {
    try {
      const r = String(roomId || currentRoom || "");
      
      if (!r) {
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }
      
      console.log(`🎮 Starting game in room ${r} (${duration}s)`);
      
      // Check if user is the host by checking the database
      let isHost = false;
      try {
        const roomFromDB = await Room.findOne({ roomId: r }).populate('host', 'username');
        if (roomFromDB && roomFromDB.host) {
          // Check if the current user is the host
          const currentPlayer = await gameState.getRoomPlayers(r);
          if (currentPlayer && currentPlayer.has(socket.id)) {
            const playerData = currentPlayer.get(socket.id);
            isHost = roomFromDB.host.username === playerData.username;
          }
        }
      } catch (dbError) {
        console.error('Database error when checking host:', dbError);
      }
      
      if (!isHost) {
        console.log("❌ User is not host, cannot start game");
        socket.emit("error", { message: "Only the host can start the game" });
        return;
      }
      
      // Validate duration
      const validDuration = Math.max(10, Math.min(300, parseInt(duration)));
      
      // Reset all players
      await resetRoomWPM(r);
      const sortedPlayers = await getSortedPlayers(r);
      io.to(r).emit("players:update", sortedPlayers);
      
      // Start game
      const gameData = {
        text: text || "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
        startTime: Date.now(),
        duration: validDuration,
        hostId: socket.id,
        roomId: r
      };
      
      io.to(r).emit("game:start", gameData);
      console.log(`✅ Game started in room ${r}`);
      
      // Set server timer
      setGameTimer(r, validDuration);
      
    } catch (error) {
      console.error('Start game error:', error);
      socket.emit("error", { message: "Failed to start game" });
    }
  });

  // Enhanced game restart
  socket.on("restartGame", async ({ roomId, text, duration = 30 }) => {
    try {
      console.log("🔄 Restart game event received");
      console.log("Room ID:", roomId);
      console.log("Text:", text);
      console.log("Duration:", duration);
      console.log("Socket ID:", socket.id);
      console.log("Current room:", currentRoom);
      console.log("Username:", username);
      
      const r = String(roomId || currentRoom || "");
      
      if (!r) {
        console.log("❌ Invalid room ID");
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }
      
      // Check if user is the host by checking the database
      let isHost = false;
      try {
        const roomFromDB = await Room.findOne({ roomId: r }).populate('host', 'username');
        if (roomFromDB && roomFromDB.host) {
          // Check if the current user is the host
          const currentPlayer = await gameState.getRoomPlayers(r);
          if (currentPlayer && currentPlayer.has(socket.id)) {
            const playerData = currentPlayer.get(socket.id);
            isHost = roomFromDB.host.username === playerData.username;
          }
        }
      } catch (dbError) {
        console.error('Database error when checking host:', dbError);
      }
      
      if (!isHost) {
        console.log("❌ User is not host, cannot restart game");
        socket.emit("error", { message: "Only the host can restart the game" });
        return;
      }
      
      console.log(`🔄 Restarting game in room ${r} (${duration}s)`);
      
      const validDuration = Math.max(10, Math.min(300, parseInt(duration) || 30));
      
      // Clear any existing timer
      gameState.clearTimer(r);
      
      // Reset all players' stats
      await resetRoomWPM(r);
      const sortedPlayers = await getSortedPlayers(r);
      io.to(r).emit("players:update", sortedPlayers);
      
      // Send restart event with game data
      const gameData = {
        text: text || "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
        startTime: Date.now(),
        duration: validDuration,
        hostId: socket.id,
        roomId: r
      };
      
      io.to(r).emit("game:restart", gameData);
      console.log(`✅ Game restarted in room ${r}`);
      console.log("Game data sent:", gameData);
      
      // Timer will be set when game actually starts, not when restarted
      
    } catch (error) {
      console.error('❌ Restart game error:', error);
      socket.emit("error", { message: "Failed to restart game" });
    }
  });

  // Enhanced WPM updates with validation
  socket.on("wpm:update", async ({ roomId, username: name, wpm, accuracy, progress, isFinal }) => {
    try {
      console.log("📊 WPM update received:");
      console.log("Room ID:", roomId);
      console.log("Username:", name);
      console.log("WPM:", wpm);
      console.log("Accuracy:", accuracy);
      console.log("Progress:", progress);
      console.log("Is final:", isFinal);
      
      const r = String(roomId || currentRoom || "");
      if (!r) {
        console.log("Invalid room ID");
        return;
      }
      
      const playersMap = await gameState.getRoomPlayers(r);
      if (!playersMap || !playersMap.has(socket.id)) {
        console.log("Player not found in room");
        return;
      }
      
      const player = playersMap.get(socket.id);
      const updatedPlayer = {
        ...player,
        username: name || player.username,
        wpm: Math.max(0, Math.min(1000, parseInt(wpm) || 0)),
        accuracy: Math.max(0, Math.min(100, parseInt(accuracy) || 100)),
        progress: Math.max(0, Math.min(100, parseInt(progress) || 0)),
        isTyping: !isFinal && progress > 0 && progress < 100,
        isFinal: isFinal || false,
        lastUpdate: Date.now()
      };
      
      playersMap.set(socket.id, updatedPlayer);
      await gameState.setRoomPlayers(r, playersMap);
      
      // Always broadcast final results immediately, throttle regular updates
      const now = Date.now();
      const lastBroadcast = gameState.inMemoryState.gameStates.get(`${r}_lastBroadcast`) || 0;
      
      if (isFinal || now - lastBroadcast > 200) {
        console.log("📡 Broadcasting players update");
        gameState.inMemoryState.gameStates.set(`${r}_lastBroadcast`, now);
        const sortedPlayers = await getSortedPlayers(r);
        io.to(r).emit("players:update", sortedPlayers);
      }
      
    } catch (error) {
      console.error('WPM update error:', error);
    }
  });

  // Enhanced game end
  socket.on("endGame", async ({ roomId }) => {
    try {
      const r = String(roomId || currentRoom || "");
      if (!r) return;
      
      const hostId = await gameState.getRoomHost(r);
      if (hostId !== socket.id) {
        socket.emit("error", { message: "Only host can end game" });
        return;
      }
      
      console.log(`🛑 Host ending game in room ${r}`);
      
      gameState.clearTimer(r);
      io.to(r).emit("game:end", { roomId: r, endedBy: socket.id });
      
    } catch (error) {
      console.error('End game error:', error);
    }
  });

  // Leave room handler
  socket.on("leaveRoom", async ({ roomId }) => {
    try {
      const r = String(roomId || currentRoom || "");
      if (!r) return;
      
      console.log(`👤 ${username} leaving room ${r}`);
      
      // Remove user from database participants list
      try {
        const room = await Room.findOne({ roomId: r });
        if (room) {
          // Find the user in the room's participants
          const user = await User.findOne({ username });
          if (user) {
            // Remove user from room's participants list in database
            room.participants = room.participants.filter(
              participant => participant.toString() !== user._id.toString()
            );
            await room.save();
            console.log(`Removed ${username} from room ${r} participants list in database`);
          }
        }
      } catch (dbError) {
        console.error('Database error when removing user from room participants:', dbError);
      }
      
      const playersMap = await gameState.getRoomPlayers(r);
      if (playersMap && playersMap.has(socket.id)) {
        // Check if leaving player was host by checking the database
        let isHost = false;
        try {
          const roomFromDB = await Room.findOne({ roomId: r }).populate('host', 'username');
          if (roomFromDB && roomFromDB.host) {
            const playerData = playersMap.get(socket.id);
            isHost = roomFromDB.host.username === playerData.username;
          }
        } catch (dbError) {
          console.error('Database error when checking host:', dbError);
        }
        
        // If host is leaving, delete the room and redirect all players
        if (isHost) {
          console.log(`👑 Host leaving room ${r}, deleting room and redirecting all players`);
          
          // Delete room from database
          try {
            await Room.deleteOne({ roomId: r });
            console.log(`🗑️ Room ${r} deleted from database`);
          } catch (dbError) {
            console.error('Database error when deleting room:', dbError);
          }
          
          // Notify all players to redirect to dashboard
          io.to(r).emit("room:deleted", { roomId: r });
          
          // Clean up room state
          await gameState.deleteRoom(r);
        } else {
          // Regular player leaving
          playersMap.delete(socket.id);
          
          // Update or clean up room
          if (playersMap.size === 0) {
            await gameState.deleteRoom(r);
          } else {
            await gameState.setRoomPlayers(r, playersMap);
            const sortedPlayers = await getSortedPlayers(r);
            io.to(r).emit("players:update", sortedPlayers);
          }
        }
      }
      
      socket.leave(r);
      currentRoom = null;
      
    } catch (error) {
      console.error('Leave room error:', error);
    }
  });
  
  // Enhanced disconnect handling
  socket.on("disconnect", async (reason) => {
    try {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
      
      if (currentRoom) {
        const playersMap = await gameState.getRoomPlayers(currentRoom);
        if (playersMap && playersMap.has(socket.id)) {
          // Check if disconnected player was host by checking the database
          let isHost = false;
          try {
            const roomFromDB = await Room.findOne({ roomId: currentRoom }).populate('host', 'username');
            if (roomFromDB && roomFromDB.host) {
              const playerData = playersMap.get(socket.id);
              isHost = roomFromDB.host.username === playerData.username;
            }
          } catch (dbError) {
            console.error('Database error when checking host:', dbError);
          }
          
          // If host disconnects, delete the room and redirect all players
          if (isHost) {
            console.log(`👑 Host disconnected from room ${currentRoom}, deleting room and redirecting all players`);
            
            // Delete room from database
            try {
              await Room.deleteOne({ roomId: currentRoom });
              console.log(`🗑️ Room ${currentRoom} deleted from database`);
            } catch (dbError) {
              console.error('Database error when deleting room:', dbError);
            }
            
            // Notify all players to redirect to dashboard
            io.to(currentRoom).emit("room:deleted", { roomId: currentRoom });
            
            // Clean up room state
            await gameState.deleteRoom(currentRoom);
          } else {
            // Regular player disconnecting
            playersMap.delete(socket.id);
            
            // Clean up or update room
            if (playersMap.size === 0) {
              console.log(`🧹 Cleaning up empty room ${currentRoom}`);
              await gameState.deleteRoom(currentRoom);
            } else {
              await gameState.setRoomPlayers(currentRoom, playersMap);
              const sortedPlayers = await getSortedPlayers(currentRoom);
              io.to(currentRoom).emit("players:update", sortedPlayers);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });

  // Heartbeat for connection monitoring
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });
});

// Error handling
io.on("error", (error) => {
  console.error('Socket.IO error:', error);
});

// FIXED: Better error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔴 SIGTERM received, shutting down gracefully...');
  
  // Clear all timers
  for (const [roomId] of gameState.inMemoryState.timers) {
    gameState.clearTimer(roomId);
  }
  
  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
  }
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// FIXED: Simplified server startup
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Storage: ${redisClient ? 'Redis + Memory' : 'Memory only'}`);
  console.log(`🌐 CORS enabled for:`, allowedOrigins);
})
.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
