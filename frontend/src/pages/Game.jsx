import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";
import LeaderboardPanel from "../components/LeaderboardPanel";
import { AuthContext } from "../context/AuthContext";

// Game constants
const DEFAULT_TEXT = "the quick brown fox jumps over the lazy dog. this pangram contains every letter of the alphabet at least once. pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump!";
const GAME_DURATION = 30;
const WORDS_PER_MINUTE_DIVISOR = 5;
//
// Utility functions
const calculateWPM = (correctChars, timeInSeconds) => {
  if (timeInSeconds <= 0) return 0;
  const minutes = timeInSeconds / 60;
  return Math.round((correctChars / WORDS_PER_MINUTE_DIVISOR) / minutes);
};
//Accuracy and progress calculations
const calculateAccuracy = (correctChars, totalTyped) => {
  if (totalTyped <= 0) return 100;
  return Math.round((correctChars / totalTyped) * 100);
};

const calculateProgress = (position, totalLength) => {
  if (totalLength <= 0) return 0;
  return Math.round((position / totalLength) * 100);
};

const getCorrectCharsCount = (input, target) => {
  let correct = 0;
  for (let i = 0; i < Math.min(input.length, target.length); i++) {
    if (input[i] === target[i]) correct++;
  }
  return correct;
};

const getErrorCount = (input, target) => {
  let errors = 0;
  for (let i = 0; i < input.length; i++) {
    if (i >= target.length || input[i] !== target[i]) errors++;
  }
  return errors;
};

export default function Game() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  // Get username from context or fallback to Anonymous
  const username = user?.username || "Anonymous";
  
  // Get game data from navigation state
  const gameDataFromState = location.state?.gameData;
  
  // Use navigation state data
  const initialGameData = gameDataFromState || {};
  
  // Game state
  const [targetText, setTargetText] = useState(
    initialGameData.text || DEFAULT_TEXT
  );
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'active', 'finished'
  const [input, setInput] = useState("");
  const [gameStats, setGameStats] = useState({
    wpm: 0,
    accuracy: 100,
    errors: 0,
    progress: 0,
    correctChars: 0
  });
  const [finalResults, setFinalResults] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  
  // Refs
  const typingAreaRef = useRef(null);
  const gameStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  
  // Initialize game
  useEffect(() => {
    // Join room for updates
    socket.emit("joinRoom", { roomId, username });
    
    // Focus typing area
    if (typingAreaRef.current) {
      typingAreaRef.current.focus();
    }
  }, [roomId, username]);
  
  // Socket listeners
  useEffect(() => {
    const playersUpdateHandler = (updatedPlayers) => {
      setPlayers(updatedPlayers || []);
      // Determine if current user is host (first player)
      const isUserHost = (updatedPlayers && updatedPlayers.length > 0 && updatedPlayers[0].username === username) || false;
      setIsHost(isUserHost);
    };
    
    const gameRestartHandler = (gameData) => {
      const { text, duration } = gameData || {};
      
      // Clear any existing timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      
      // Reset local game state for new game
      if (text) setTargetText(text);
      setTimeLeft(duration || GAME_DURATION);
      setGameState('waiting');
      setInput("");
      setGameStats({
        wpm: 0,
        accuracy: 100,
        errors: 0,
        progress: 0,
        correctChars: 0
      });
      setFinalResults(null);
      gameStartTimeRef.current = null;
      
      // Focus typing area after state reset
      setTimeout(() => {
        if (typingAreaRef.current) {
          typingAreaRef.current.focus();
        }
      }, 100);
    };
    
    const gameStopTypingHandler = () => {
      endGame();
    };
    
    // Register socket listeners
    socket.on("players:update", playersUpdateHandler);
    socket.on("game:restart", gameRestartHandler);
    socket.on("game:stopTyping", gameStopTypingHandler);
    socket.on("room:deleted", ({ roomId: deletedRoomId }) => {
      if (deletedRoomId === roomId) {
        navigate('/dashboard');
      }
    });
    
    // Cleanup function
    return () => {
      socket.off("players:update", playersUpdateHandler);
      socket.off("game:restart", gameRestartHandler);
      socket.off("game:stopTyping", gameStopTypingHandler);
      socket.off("room:deleted");
      
      // Clear timer on unmount
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [roomId, username]);
  
  // Calculate and update game statistics
  const updateGameStats = useCallback((currentInput, startTime) => {
    const now = Date.now();
    const timeElapsed = startTime ? (now - startTime) / 1000 : 0;
    
    const correctChars = getCorrectCharsCount(currentInput, targetText);
    const errors = getErrorCount(currentInput, targetText);
    const wpm = calculateWPM(correctChars, timeElapsed);
    const accuracy = calculateAccuracy(correctChars, currentInput.length);
    const progress = calculateProgress(correctChars, targetText.length);
    
    const newStats = {
      wpm: wpm,
      accuracy,
      errors,
      progress,
      correctChars,
      timeElapsed
    };
    
    setGameStats(newStats);
    return newStats;
  }, [targetText]);
  
  // Start the game
  const startGame = useCallback(() => {
    if (gameState !== 'waiting') return;
    
    console.log('Starting game...');
    setGameState('active');
    setTimeLeft(GAME_DURATION);
    gameStartTimeRef.current = Date.now();
    
    // Start countdown timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Focus typing area
    if (typingAreaRef.current) {
      typingAreaRef.current.focus();
    }
  }, [gameState]);
  
  // End the game
  const endGame = useCallback(() => {
    if (gameState !== 'active') return;
    
    console.log('Ending game...');
    
    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Calculate final stats
    const finalStats = updateGameStats(input, gameStartTimeRef.current);
    const completed = input === targetText;
    
    const results = {
      ...finalStats,
      completed,
      finalInput: input,
      targetLength: targetText.length
    };
    
    setFinalResults(results);
    setGameState('finished');
    
    // Send final update to server
    socket.emit("wpm:update", {
      roomId,
      username,
      wpm: finalStats.wpm || 0,
      accuracy: finalStats.accuracy || 100,
      progress: finalStats.progress || 0,
      isFinal: true
    });
    
    console.log('Final results:', results);
  }, [gameState, input, targetText, updateGameStats, roomId, username]);
  
  // Handle timer reaching zero
  useEffect(() => {
    if (timeLeft === 0 && gameState === 'active') {
      endGame();
    }
  }, [timeLeft, gameState, endGame]);
  
  // Handle keyboard input
  const handleKeyDown = useCallback((e) => {
    // Start game on first keystroke
    if (gameState === 'waiting' && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      startGame();
      return;
    }
    
    if (gameState !== 'active') return;
    
    e.preventDefault();
    
    if (e.key === 'Backspace') {
      if (input.length > 0) {
        const newInput = input.slice(0, -1);
        setInput(newInput);
        const stats = updateGameStats(newInput, gameStartTimeRef.current);
        
        // Send update to server
        socket.emit("wpm:update", {
          roomId,
          username,
          wpm: stats?.wpm || 0,
          accuracy: stats?.accuracy || 100,
          progress: stats?.progress || 0
        });
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      // Prevent typing beyond text length
      if (input.length >= targetText.length) return;
      
      const newInput = input + e.key;
      setInput(newInput);
      const stats = updateGameStats(newInput, gameStartTimeRef.current);
      
      // Send update to server
      socket.emit("wpm:update", {
        roomId,
        username,
        wpm: stats?.wpm || 0,
        accuracy: stats?.accuracy || 100,
        progress: stats?.progress || 0
      });
      
      // Check if completed
      if (newInput === targetText) {
        setTimeout(endGame, 100);
      }
    }
  }, [gameState, input, targetText, startGame, endGame, updateGameStats, roomId, username]);
  
  // Restart game (host only)
  const restartGame = () => {
    if (!isHost) return;
    
    // Reset local state immediately for better UX
    setGameState('waiting');
    setFinalResults(null);
    
    // Emit restart request; server will broadcast game:restart
    socket.emit("restartGame", {
      roomId,
      text: targetText,
      duration: GAME_DURATION
    });
  };
  
  // Return to dashboard
  const returnToDashboard = () => {
    // Leave the room
    socket.emit("leaveRoom", { roomId, username });
    navigate('/dashboard');
  };
  
  // Leave room and navigate to dashboard
  const leaveRoom = () => {
    socket.emit("leaveRoom", { roomId, username });
    navigate('/dashboard');
  };
  
  // Render text with highlighting
  const renderText = () => {
    return targetText.split('').map((char, index) => {
      let className = 'letter';
      
      if (index < input.length) {
        className += input[index] === char ? ' correct' : ' incorrect';
      } else if (index === input.length && gameState === 'active') {
        className += ' current';
      }
      
      // Make spaces visible with a special character or styling
      const displayChar = char === ' ' ? '\u00A0' : char;
      
      return (
        <span key={index} className={className}>
          {displayChar}
        </span>
      );
    });
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  return (
    <div className="fade-in">
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 100px)' }}>
        {/* Left Side - Typing Area */}
        <div style={{ flex: '1' }}>
          {/* Game Header */}
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-accent mb-1" style={{ fontSize: '1.5rem', fontWeight: '400' }}>
                  typing test
                </h1>
                <p className="text-dim" style={{ fontSize: '0.875rem' }}>
                  room: <span className="text-bright">{roomId}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                {gameState !== 'finished' && (
                  <>
                    <button
                      className="btn btn-ghost"
                      onClick={leaveRoom}
                    >
                      leave room
                    </button>
                    <div className="text-center">
                      <div className="text-accent" style={{ fontSize: '2rem', fontWeight: '600' }}>
                        {timeLeft}
                      </div>
                      <div className="text-dim" style={{ fontSize: '0.75rem' }}>seconds</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="stats justify-center mb-4">
            <div className="stat">
              <div className="stat-value">{gameStats.wpm}</div>
              <div className="stat-label">wpm</div>
            </div>
            <div className="stat">
              <div className="stat-value">{gameStats.accuracy}%</div>
              <div className="stat-label">accuracy</div>
            </div>
            <div className="stat">
              <div className="stat-value text-error">{gameStats.errors}</div>
              <div className="stat-label">errors</div>
            </div>
            <div className="stat">
              <div className="stat-value text-accent">{gameStats.progress}%</div>
              <div className="stat-label">progress</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-bar mb-4">
            <div className="progress-fill" style={{ width: `${gameStats.progress}%` }}></div>
          </div>
          
          {gameState !== 'finished' ? (
            <>
              {/* Typing Area */}
              <div
                ref={typingAreaRef}
                tabIndex={0}
                className="typing-test card"
                onKeyDown={handleKeyDown}
                onClick={() => typingAreaRef.current?.focus()}
                style={{
                  cursor: 'text',
                  minHeight: '200px',
                  padding: '2rem',
                  outline: 'none',
                  userSelect: 'none',
                  fontSize: '1.25rem',
                  lineHeight: '2rem'
                }}
              >
                {renderText()}
              </div>
              
              <div className="text-center mt-3">
                <p className="text-dim" style={{ fontSize: '0.875rem' }}>
                  {gameState === 'active'
                    ? 'type the text above'
                    : 'start typing to begin the test'
                  }
                </p>
              </div>
            </>
          ) : (
            /* Results Display */
            <div className="card" style={{ maxWidth: '700px', margin: '0 auto' }}>
              <h2 className="text-accent mb-4 text-center" style={{ fontSize: '2rem', fontWeight: '300' }}>
                test complete
              </h2>
              
              <div className="gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div className="card p-4 text-center">
                  <div className="text-accent" style={{ fontSize: '3rem', fontWeight: '600' }}>
                    {finalResults?.wpm || gameStats.wpm}
                  </div>
                  <div className="text-dim" style={{ fontSize: '0.875rem' }}>
                    words per minute
                  </div>
                </div>
                
                <div className="card p-4 text-center">
                  <div className="text-bright" style={{ fontSize: '3rem', fontWeight: '600' }}>
                    {finalResults?.accuracy || gameStats.accuracy}%
                  </div>
                  <div className="text-dim" style={{ fontSize: '0.875rem' }}>
                    accuracy
                  </div>
                </div>
                
                <div className="card p-4 text-center">
                  <div className="text-error" style={{ fontSize: '3rem', fontWeight: '600' }}>
                    {finalResults?.errors || gameStats.errors}
                  </div>
                  <div className="text-dim" style={{ fontSize: '0.875rem' }}>
                    mistakes
                  </div>
                </div>
                
                <div className="card p-4 text-center">
                  <div className="text-accent" style={{ fontSize: '3rem', fontWeight: '600' }}>
                    {finalResults?.progress || gameStats.progress}%
                  </div>
                  <div className="text-dim" style={{ fontSize: '0.875rem' }}>
                    completion
                  </div>
                </div>
              </div>
            
              
              {/* Action Buttons */}
              <div className="flex gap-3 justify-center mt-6">
                {isHost && (
                  <button
                    className="btn btn-primary"
                    onClick={restartGame}
                    style={{ minWidth: '150px' }}
                  >
                    restart game
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={leaveRoom}
                  style={{ minWidth: '150px' }}
                >
                  leave room
                </button>
              </div>
              
              {!isHost && (
                <div className="text-center mt-3">
                  <p className="text-dim" style={{ fontSize: '0.75rem' }}>
                    waiting for host to restart the game
                  </p>
                </div>
                )}
            </div>
          )}
        </div>
        
        {/* Right Side - Leaderboard */}
        <div style={{ width: '350px' }}>
          <LeaderboardPanel players={players} />
        </div>
      </div>
    </div>
  );
}