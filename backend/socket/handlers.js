import User from "../models/User.js";
import Room from "../models/Room.js";
import { gameState } from "../state/gameState.js";
import { createPlayerData, getSortedPlayers, resetRoomWPM } from "./utils.js";
import { setGameTimer } from "./timers.js";



export function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    let currentRoom = null;
    let username = null;

    socket.on("joinRoom", async ({ roomId, username: name }) => {
      try {
        currentRoom = String(roomId);
        username = name || `Guest_${socket.id.substring(0, 6)}`;

        socket.join(currentRoom);

        let playersMap = await gameState.getRoomPlayers(currentRoom);
        if (!(playersMap instanceof Map)) {
          playersMap = new Map();
        }

        let roomFromDB = null;
        try {
          roomFromDB = await Room.findOne({ roomId: currentRoom });
        } catch (dbError) {
          console.error('Database error when checking room:', dbError);
        }

        if (playersMap.size === 0) {
          if (!roomFromDB) {
            await gameState.setRoomHost(currentRoom, socket.id);
          }
        }

        playersMap.set(socket.id, createPlayerData(username, socket.id));
        await gameState.setRoomPlayers(currentRoom, playersMap);

        const sortedPlayers = await getSortedPlayers(currentRoom);
        io.to(currentRoom).emit("players:update", sortedPlayers);
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

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
      } catch (error) {
        console.error('Message error:', error);
      }
    });

    socket.on("startGame", async ({ roomId, text, duration = 30 }) => {
      try {
        const r = String(roomId || currentRoom || "");
        if (!r) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        let isHost = false;
        try {
          const roomFromDB = await Room.findOne({ roomId: r }).populate('host', 'username');
          if (roomFromDB && roomFromDB.host) {
            const currentPlayer = await gameState.getRoomPlayers(r);
            if (currentPlayer && currentPlayer.has(socket.id)) {
              const playerData = currentPlayer.get(socket.id);
              isHost = roomFromDB.host.username === playerData.username;
            }
          }
        } catch (dbError) {
          console.error('Database error when checking host:', dbError);
        }
        // Fallback to in-memory host if DB host not set
        if (!isHost) {
          try {
            const memHostId = await gameState.getRoomHost(r);
            if (memHostId && memHostId === socket.id) {
              isHost = true;
            }
          } catch {}
        }

        if (!isHost) {
          socket.emit("error", { message: "Only the host can start the game" });
          return;
        }

        const validDuration = Math.max(10, Math.min(300, parseInt(duration)));

        await resetRoomWPM(r);
        const sortedPlayers = await getSortedPlayers(r);
        io.to(r).emit("players:update", sortedPlayers);

        const gameData = {
          text: text || "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
          startTime: Date.now(),
          duration: validDuration,
          hostId: socket.id,
          roomId: r
        };

        io.to(r).emit("game:start", gameData);
        setGameTimer(io, r, validDuration);
      } catch (error) {
        console.error('Start game error:', error);
        socket.emit("error", { message: "Failed to start game" });
      }
    });

    socket.on("restartGame", async ({ roomId, text, duration = 30 }) => {
      try {
        const r = String(roomId || currentRoom || "");
        if (!r) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        let isHost = false;
        try {
          const roomFromDB = await Room.findOne({ roomId: r }).populate('host', 'username');
          if (roomFromDB && roomFromDB.host) {
            const currentPlayer = await gameState.getRoomPlayers(r);
            if (currentPlayer && currentPlayer.has(socket.id)) {
              const playerData = currentPlayer.get(socket.id);
              isHost = roomFromDB.host.username === playerData.username;
            }
          }
        } catch (dbError) {
          console.error('Database error when checking host:', dbError);
        }
        // Fallback to in-memory host if DB host not set
        if (!isHost) {
          try {
            const memHostId = await gameState.getRoomHost(r);
            if (memHostId && memHostId === socket.id) {
              isHost = true;
            }
          } catch {}
        }

        if (!isHost) {
          socket.emit("error", { message: "Only the host can restart the game" });
          return;
        }

        const validDuration = Math.max(10, Math.min(300, parseInt(duration) || 30));
        gameState.clearTimer(r);

        await resetRoomWPM(r);
        const sortedPlayers = await getSortedPlayers(r);
        io.to(r).emit("players:update", sortedPlayers);

        const gameData = {
          text: text || "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
          startTime: Date.now(),
          duration: validDuration,
          hostId: socket.id,
          roomId: r
        };

        io.to(r).emit("game:restart", gameData);
      } catch (error) {
        console.error('❌ Restart game error:', error);
        socket.emit("error", { message: "Failed to restart game" });
      }
    });

    socket.on("wpm:update", async ({ roomId, username: name, wpm, accuracy, progress, isFinal }) => {
      try {
        const r = String(roomId || currentRoom || "");
        if (!r) return;

        const playersMap = await gameState.getRoomPlayers(r);
        if (!playersMap || !playersMap.has(socket.id)) return;

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

        const now = Date.now();
        const lastBroadcast = gameState.inMemoryState.gameStates.get(`${r}_lastBroadcast`) || 0;
        if (isFinal || now - lastBroadcast > 200) {
          gameState.inMemoryState.gameStates.set(`${r}_lastBroadcast`, now);
          const sortedPlayers = await getSortedPlayers(r);
          io.to(r).emit("players:update", sortedPlayers);
        }
      } catch (error) {
        console.error('WPM update error:', error);
      }
    });

    socket.on("endGame", async ({ roomId }) => {
      try {
        const r = String(roomId || currentRoom || "");
        if (!r) return;

        const hostId = await gameState.getRoomHost(r);
        if (hostId !== socket.id) {
          socket.emit("error", { message: "Only host can end game" });
          return;
        }

        gameState.clearTimer(r);
        io.to(r).emit("game:end", { roomId: r, endedBy: socket.id });
      } catch (error) {
        console.error('End game error:', error);
      }
    });

    socket.on("leaveRoom", async ({ roomId }) => {
      try {
        const r = String(roomId || currentRoom || "");
        if (!r) return;

        try {
          const room = await Room.findOne({ roomId: r });
          if (room) {
            const user = await User.findOne({ username });
            if (user) {
              room.participants = room.participants.filter(
                participant => participant.toString() !== user._id.toString()
              );
              await room.save();
            }
          }
        } catch (dbError) {
          console.error('Database error when removing user from room participants:', dbError);
        }

        const playersMap = await gameState.getRoomPlayers(r);
        if (playersMap && playersMap.has(socket.id)) {
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

          if (isHost) {
            try {
              await Room.deleteOne({ roomId: r });
            } catch {}
            io.to(r).emit("room:deleted", { roomId: r });
            await gameState.deleteRoom(r);
          } else {
            playersMap.delete(socket.id);
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

        // After leaving the room, broadcast latest players list to remaining users
        try {
          const remainingPlayers = await gameState.getRoomPlayers(r);
          if (remainingPlayers && remainingPlayers.size > 0) {
            const sortedPlayers = await getSortedPlayers(r);
            io.to(r).emit("players:update", sortedPlayers);
          }
        } catch {}
      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    socket.on("disconnect", async (reason) => {
      try {
        if (currentRoom) {
          const playersMap = await gameState.getRoomPlayers(currentRoom);
          if (playersMap && playersMap.has(socket.id)) {
            let isHost = false;
            try {
              const roomFromDB = await Room.findOne({ roomId: currentRoom }).populate('host', 'username');
              if (roomFromDB && roomFromDB.host) {
                const playerData = playersMap.get(socket.id);
                isHost = roomFromDB.host.username === playerData.username;
              }
            } catch (dbError) {}

            if (isHost) {
              try {
                await Room.deleteOne({ roomId: currentRoom });
              } catch {}
              io.to(currentRoom).emit("room:deleted", { roomId: currentRoom });
              await gameState.deleteRoom(currentRoom);
            } else {
              playersMap.delete(socket.id);
              if (playersMap.size === 0) {
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

    socket.on("ping", () => {
      socket.emit("pong", { timestamp: Date.now() });
    });
  });

  io.on("error", (error) => {
    console.error('Socket.IO error:', error);
  });
}


