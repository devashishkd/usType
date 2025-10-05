import { gameState } from "../state/gameState.js";

export const setGameTimer = (io, roomId, duration) => {
  gameState.clearTimer(roomId);

  const timerId = setTimeout(async () => {
    try {
      io.to(roomId).emit("game:stopTyping", { roomId, timestamp: Date.now() });
      gameState.clearTimer(roomId);
    } catch (error) {
      console.error('Timer callback error:', error);
    }
  }, duration * 1000);

  gameState.setTimer(roomId, timerId);
};


