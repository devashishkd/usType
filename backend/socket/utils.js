import Room from "../models/Room.js";
import { gameState } from "../state/gameState.js";

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

    let roomFromDB = null;
    let inMemoryHostId = null;
    try {
      roomFromDB = await Room.findOne({ roomId }).populate('host', 'username');
    } catch (dbError) {
      console.error('Database error when getting room info:', dbError);
    }
    try {
      inMemoryHostId = await gameState.getRoomHost(roomId);
    } catch {}

    const players = Array.from(playersMap.values())
      .filter(p => p && p.username)
      .map(p => ({
        username: p.username,
        wpm: Math.max(0, p.wpm || 0),
        accuracy: Math.min(100, Math.max(0, p.accuracy || 100)),
        progress: Math.min(100, Math.max(0, p.progress || 0)),
        isTyping: p.isTyping || false,
        lastUpdate: p.lastUpdate || Date.now(),
        isHost: (
          (roomFromDB && roomFromDB.host && roomFromDB.host.username === p.username) ||
          (inMemoryHostId && p.id && inMemoryHostId === p.id)
        )
      }))
      .sort((a, b) => {
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

export { createPlayerData, getSortedPlayers, resetRoomWPM };


