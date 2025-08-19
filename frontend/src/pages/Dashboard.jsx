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
    
    </div>
  );
}

