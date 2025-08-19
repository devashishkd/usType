import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const username = localStorage.getItem("username") || "Anonymous";
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Join room on mount
  useEffect(() => {
    socket.emit("joinRoom", { roomId, username });
    
    // Check if user is host (first player)
    socket.on("players:update", (updatedPlayers) => {
      setPlayers(updatedPlayers);
      setIsHost(updatedPlayers.length > 0 && updatedPlayers[0].username === username);
    });
    
    // Listen for messages
    socket.on("message", (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    // Listen for game start - redirect to game page
    socket.on("game:start", ({ text, duration }) => {
      // Store game data in localStorage for the Game page
      localStorage.setItem("gameData", JSON.stringify({ 
        roomId, 
        text, 
        duration,
        startTime: Date.now()
      }));
      navigate(`/game/${roomId}`);
    });
    
    return () => {
      socket.off("players:update");
      socket.off("message");
      socket.off("game:start");
    };
  }, [roomId, username, navigate]);
  
  // Send message
  const sendMessage = () => {
    if (messageInput.trim()) {
      socket.emit("message", { 
        roomId, 
        user: username, 
        text: messageInput.trim() 
      });
      setMessageInput("");
    }
  };
  
  // Start game handler
  const startGame = () => {
    const targetText = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!";
    socket.emit("startGame", { roomId, text: targetText, duration: 30 });
  };
  
  // Leave room handler
  const leaveRoom = () => {
    socket.emit("leaveRoom", { roomId });
    navigate('/dashboard');
  };
  
  return (
    <div className="fade-in">
      <div style={{ minHeight: 'calc(100vh - 100px)' }}>
        {/* Room Header */}
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-accent mb-1" style={{ fontSize: '1.5rem', fontWeight: '400' }}>
                room lobby
              </h1>
              <p className="text-dim" style={{ fontSize: '0.875rem' }}>
                room id: <span className="text-bright font-mono">{roomId}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {isHost && (
                <button
                  onClick={startGame}
                  className="btn btn-primary"
                  disabled={players.length === 0}
                >
                  start game
                </button>
              )}
              <button
                onClick={leaveRoom}
                className="btn btn-ghost"
              >
                leave room
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex gap-4" style={{ height: 'calc(100vh - 250px)' }}>
          {/* Left Side - Chat */}
          <div className="flex-1 card flex flex-col" style={{ minHeight: '400px' }}>
            <div className="mb-3">
              <h2 className="text-bright" style={{ fontSize: '1.125rem', fontWeight: '400' }}>
                chat room
              </h2>
              <p className="text-dim" style={{ fontSize: '0.75rem' }}>
                {isHost ? 'you are the host - you can start the game' : 'waiting for host to start the game'}
              </p>
            </div>
            
            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto mb-3 p-3"
              style={{ 
                backgroundColor: 'var(--sub-alt-color)',
                borderRadius: '0.5rem',
                maxHeight: '400px'
              }}
            >
              {messages.length === 0 ? (
                <div className="text-center text-dim" style={{ fontSize: '0.875rem' }}>
                  no messages yet. say hello!
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className="mb-2">
                    <span className="text-accent" style={{ fontSize: '0.875rem' }}>
                      {msg.user}:
                    </span>
                    <span className="text-bright ml-2" style={{ fontSize: '0.875rem' }}>
                      {msg.text}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="input flex-1"
                style={{ fontSize: '0.875rem' }}
              />
              <button
                onClick={sendMessage}
                className="btn btn-primary"
                disabled={!messageInput.trim()}
              >
                send
              </button>
            </div>
          </div>
          
          {/* Right Side - Players List */}
          <div className="card" style={{ width: '320px' }}>
            <div className="mb-3">
              <h2 className="text-bright" style={{ fontSize: '1.125rem', fontWeight: '400' }}>
                players ({players.length})
              </h2>
              <p className="text-dim" style={{ fontSize: '0.75rem' }}>
                waiting in lobby
              </p>
            </div>
            
            {players.length === 0 ? (
              <div className="text-center p-4">
                <div className="text-dim mb-2">no players yet</div>
                <p className="text-dim" style={{ fontSize: '0.75rem' }}>
                  share the room id with friends
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div 
                    key={player.username}
                    className="p-3"
                    style={{ 
                      backgroundColor: 'var(--sub-alt-color)',
                      borderRadius: '0.5rem',
                      border: index === 0 ? '1px solid var(--main-color)' : 'none'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-bright" style={{ fontSize: '0.875rem' }}>
                          {player.username}
                        </span>
                        {index === 0 && (
                          <span className="text-accent" style={{ fontSize: '0.75rem' }}>
                            (host)
                          </span>
                        )}
                      </div>
                      <div className="text-dim" style={{ fontSize: '0.75rem' }}>
                        ready
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Room Stats */}
            {players.length > 0 && (
              <div className="mt-4 p-3" style={{ 
                backgroundColor: 'var(--bg-color)',
                borderRadius: '0.5rem'
              }}>
                <div className="text-center">
                  <div className="text-accent mb-1" style={{ fontSize: '2rem', fontWeight: '600' }}>
                    {players.length}
                  </div>
                  <div className="text-dim" style={{ fontSize: '0.75rem' }}>
                    players ready
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}