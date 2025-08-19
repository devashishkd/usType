import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [joinName, setJoinName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const { data } = await api.get("/rooms");
      setRooms(data);
    } catch (e) {
      setError(e.response?.data?.message || "cannot load rooms");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createRoom = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/rooms", {
        text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.",
      });
      setRooms([data, ...rooms]);
      // Redirect to the created room
      navigate(`/room/${data.roomId}`);
      setError(null);
    } catch (e) {
      setError(e.response?.data?.message || "cannot create room");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!joinName.trim()) {
      setError("room name is required");
      return;
    }

    setLoading(true);
    try {
      const { data: allRooms } = await api.get("/rooms");
      const room = allRooms.find((r) => r.name === joinName);

      if (!room) {
        setError("room not found");
        setLoading(false);
        return;
      }

      await api.put(`/rooms/${room.roomId}/join`);
      navigate(`/room/${room.roomId}`);
    } catch (e) {
      setError(e.response?.data?.message || "cannot join room");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter" && !loading) {
      action();
    }
  };

  return (
    <div
      className="fade-in"
      style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
    >
      {/* Error Message */}
      {error && (
        <div
          className="mb-4 p-4 text-center"
          style={{
            backgroundColor: "var(--error-extra-color)",
            borderRadius: "0.5rem",
            color: "var(--error-color)",
            fontSize: "0.875rem",
            maxWidth: "600px",
            margin: "0 auto 3rem",
          }}
        >
          {error}
        </div>
      )}
      
      {/* Create/Join Room Section */}
      <div className="flex gap-4 mb-8" style={{ flexWrap: "wrap" }}>
        {/* Create Room Card */}
        <div
          className="card"
          style={{ padding: "2rem", flex: "1", minWidth: "300px" }}
        >
          <h3
            className="text-bright mb-4"
            style={{ fontSize: "1.125rem", fontWeight: "400" }}
          >
            create room
          </h3>
          <div className="flex gap-3 mb-3">
            <button
              onClick={createRoom}
              disabled={loading}
              className="btn btn-primary"
              style={{ minWidth: "80px", padding: "0.75rem 1rem", flex: "1" }}
            >
              create room
            </button>
          </div>
          <p
            className="text-dim"
            style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
          >
            create a new room and invite others
          </p>
        </div>
        
        
        {/* Join Room Card */}
        <div
          className="card"
          style={{ padding: "2rem", flex: "1", minWidth: "300px" }}
        >
          <h3
            className="text-bright mb-4"
            style={{ fontSize: "1.125rem", fontWeight: "400" }}
          >
            join room
          </h3>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="room name"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, joinRoom)}
              className="input"
              disabled={loading}
              style={{ fontSize: "0.875rem", padding: "0.75rem", flex: "1" }}
            />
            <button
              onClick={joinRoom}
              disabled={!joinName.trim() || loading}
              className="btn btn-primary"
              style={{ minWidth: "80px", padding: "0.75rem 1rem" }}
            >
              join
            </button>
          </div>
          <p
            className="text-dim"
            style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
          >
            enter room name to join
          </p>
        </div>
      </div>
      {/* Available Rooms Section */}
      <div
        style={{ maxWidth: "900px", margin: "0 auto", marginBottom: "4rem" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-bright"
            style={{ fontSize: "1.125rem", fontWeight: "400" }}
          >
            available rooms
          </h3>
          <button
            onClick={load}
            className="btn btn-ghost btn-icon"
            title="refresh rooms"
            style={{ padding: "0.5rem" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
        
        {rooms.length > 0 ? (
          <div
            className="gap-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            }}
          >
            {rooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => navigate(`/room/${room.roomId}`)}
                className="card text-left"
                style={{
                  cursor: "pointer",
                  transition:
                    "all var(--transition-speed) var(--transition-smooth)",
                  padding: "1.5rem",
                }}
              >
                <div
                  className="text-bright mb-2"
                  style={{ fontSize: "0.875rem", fontWeight: "500" }}
                >
                  {room.name}
                </div>
                <div className="text-dim" style={{ fontSize: "0.75rem" }}>
                  {room.players?.length || 0} players
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card text-center" style={{ padding: "3rem 2rem" }}>
            <p className="text-dim mb-2" style={{ fontSize: "0.875rem" }}>
              no rooms available
            </p>
            <p className="text-dim" style={{ fontSize: "0.75rem" }}>
              create a room to start typing
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

