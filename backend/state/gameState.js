class GameStateManager {
  constructor() {
    this.inMemoryState = {
      rooms: new Map(),
      hosts: new Map(),
      timers: new Map(),
      gameStates: new Map()
    };
  }

  _mapToObject(map) {
    if (!map || !(map instanceof Map)) return {};
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  _objectToMap(obj) {
    if (!obj || typeof obj !== 'object') return new Map();
    const map = new Map();
    for (const [key, value] of Object.entries(obj)) {
      map.set(key, value);
    }
    return map;
  }

  async setRoomPlayers(roomId, players) {
    this.inMemoryState.rooms.set(roomId, players);
  }

  async getRoomPlayers(roomId) {
    return this.inMemoryState.rooms.get(roomId) || new Map();
  }

  async setRoomHost(roomId, hostId) {
    this.inMemoryState.hosts.set(roomId, hostId);
  }

  async getRoomHost(roomId) {
    return this.inMemoryState.hosts.get(roomId);
  }

  async deleteRoom(roomId) {
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

export { GameStateManager, gameState };


