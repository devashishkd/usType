import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { createIo } from "./socket/io.js";
import { registerSocketHandlers } from "./socket/handlers.js";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/room.js";
import cookieParser from "cookie-parser";


dotenv.config();
await connectDB();

const app = express();

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

const server = http.createServer(app);

const io = createIo(server, allowedOrigins);


import { gameState } from "./state/gameState.js";


// Error handling
registerSocketHandlers(io);

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
  
  // Close server
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Storage: Memory only`);
  console.log(`🌐 CORS enabled for:`, allowedOrigins);
})
.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
