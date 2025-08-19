# Modern Typing Game

A high-performance multiplayer typing game built with MERN stack and Redis for real-time communication.

## Features

- Real-time multiplayer typing
- Leaderboards and rankings
- Room-based gameplay
- Socket.IO for real-time communication
- Redis for session management
- JWT authentication
- Responsive design

## Tech Stack

- **Frontend**: React, Vite, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO Server
- **Database**: MongoDB
- **Cache**: Redis
- **Authentication**: JWT

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis (optional but recommended for production)

## Redis Setup

The application uses Redis for scalable session management. If Redis is not available, the application will fall back to in-memory storage, but this will limit scalability and persistence across multiple server instances.

To run Redis locally:
1. Install Redis on your system
2. Start Redis server: `redis-server`
3. Ensure the Redis URL in `.env` is correct (default: `redis://localhost:6379`)

If you don't want to use Redis, you can modify the code to remove Redis dependencies, but this will affect the application's scalability.

## Run backend
```bash
cd backend
cp .env.example .env
# edit .env if needed
npm install
npm run dev
```

## Run frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173

## Notes
- Backend on http://localhost:5000
- JWT stored in localStorage (demo only).
- Real-time via Socket.IO; messages are in-memory (not persisted) for simplicity.
```
