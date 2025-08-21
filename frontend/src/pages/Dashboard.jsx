import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

// Configure axios to always send credentials (cookies)
axios.defaults.withCredentials = true;

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [joinName, setJoinName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, checkAuth, isLoading } = useContext(AuthContext);

  const load = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || "https://typex-jygr.onrender.com/api";
      const { data } = await axios.get(`${baseURL}/rooms`);
      setRooms(data);
    } catch (e) {
      if (e.response?.status === 401) {
        // User is not authenticated, redirect to login
        navigate('/login');
        return;
      }
      setError(e.response?.data?.message || "cannot load rooms");
    }
  };

  useEffect(() => {
    // Don't load if still checking authentication
    if (isLoading) {
      load();
    }
  }, [checkAuth]);

  const createRoom = async () => {
    if (!user) {
      setError("Please log in to create a room");
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      
      const baseURL = import.meta.env.VITE_API_URL;
      console.log("room api :", baseURL)
      const { data } = await axios.post(`${baseURL}/rooms`, {
        text: "the quick brown fox jumps over the lazy dog. pack my box with five dozen liquor jugs.",
      });
      
      console.log("New room created:", data);
      setRooms([data, ...rooms]);
      // Navigate to room with game data in state
      navigate(`/room/${data.roomId}`, {
        state: {
          roomData: data
        }
      });
      setError(null);
    } catch (e) {
      if (e.response?.status === 401) {
        setError("Please log in to create a room");
        navigate('/login');
        return;
      }
      setError(e.response?.data?.message || "cannot create room");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!user) {
      setError("Please log in to join a room");
      navigate('/login');
      return;
    }

    if (!joinName.trim()) {
      setError("room name is required");
      return;
    }

    setLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || "https://typex-jygr.onrender.com/api";
      const { data: allRooms } = await axios.get(`${baseURL}/rooms`);
      const room = allRooms.find((r) => r.name === joinName);

      if (!room) {
        setError("room not found");
        setLoading(false);
        return;
      }

      await axios.put(`${baseURL}/rooms/${room.roomId}/join`);
      
      // Navigate to room with room data in state
      navigate(`/room/${room.roomId}`, {
        state: {
          roomData: room
        }
      });
    } catch (e) {
      if (e.response?.status === 401) {
        setError("Please log in to join a room");
        navigate('/login');
        return;
      }
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

  const refreshRooms = async () => {
    await load();
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="fade-in text-center" style={{ paddingTop: "4rem" }}>
        <div className="text-dim">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div
      className="fade-in"
      style={{ paddingTop: "2rem", paddingBottom: "2rem" }}
    >
      {/* Welcome Section */}
      <div className="text-center mb-6">
        <h1 
          className="text-accent mb-2" 
          style={{ fontSize: '2rem', fontWeight: '300' }}
        >
          welcome back, {user.username}
        </h1>
        <p className="text-dim" style={{ fontSize: '0.875rem' }}>
          create a new room or join an existing one to start typing
        </p>
      </div>

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
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              marginLeft: '1rem',
              textDecoration: 'underline'
            }}
          >
            dismiss
          </button>
        </div>
      )}
      
      {/* Create/Join Room Section */}
      <div className="flex gap-4 mb-8" style={{ flexWrap: "wrap", maxWidth: "800px", margin: "0 auto" }}>
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
              style={{ 
                minWidth: "120px", 
                padding: "0.75rem 1rem", 
                flex: "1",
                opacity: loading ? 0.6 : 1 
              }}
            >
              {loading ? "creating..." : "create room"}
            </button>
          </div>
          <p
            className="text-dim"
            style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
          >
            create a new room and invite others to join
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
              style={{ 
                minWidth: "80px", 
                padding: "0.75rem 1rem",
                opacity: (!joinName.trim() || loading) ? 0.6 : 1
              }}
            >
              {loading ? "joining..." : "join"}
            </button>
          </div>
          <p
            className="text-dim"
            style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
          >
            enter room name to join an existing room
          </p>
        </div>
      </div>
      {/* Rooms List Section */}
      {console.log('urel:',import.meta.env.VITE_API_URL)}
      {(import.meta.env.HELLO === 'development') && (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="flex justify-between items-center mb-4">
            <h3 
              className="text-bright" 
              style={{ fontSize: "1.125rem", fontWeight: "400" }}
            >
              available rooms ({rooms.length})
            </h3>
            <button
              onClick={refreshRooms}
              disabled={loading}
              className="btn btn-ghost"
              style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}
            >
              refresh
            </button>
          </div>

          {rooms.length === 0 ? (
            <div className="card text-center p-6">
              <div className="text-dim mb-2">no active rooms</div>
              <p className="text-dim" style={{ fontSize: "0.75rem" }}>
                create a new room to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
              {rooms.map((room) => (
                <div key={room.roomId} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-bright" style={{ fontSize: "1rem", fontWeight: "400" }}>
                        {room.name || room.roomId}
                      </h4>
                      <p className="text-dim" style={{ fontSize: "0.75rem" }}>
                        {room.playerCount || 0} players • created {new Date(room.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/room/${room.roomId}`, {
                        state: { roomData: room }
                      })}
                      className="btn btn-primary"
                      style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}
                    >
                      join
                    </button>
                  </div>
                  {room.status && (
                    <div className="text-dim" style={{ fontSize: "0.75rem" }}>
                      Status: {room.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}