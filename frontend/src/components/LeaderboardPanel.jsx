import React from "react";

export default function LeaderboardPanel({ players, currentUser }) {
  console.log("🏆 LeaderboardPanel received players:", players);
  
  // Sort players by progress (descending), then by username
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.progress !== a.progress) {
      return (b.progress || 0) - (a.progress || 0);
    }
    return a.username.localeCompare(b.username);
  });
  
  // Get rank display
  const getRankDisplay = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };
  
  // Get rank class
  const getRankClass = (index) => {
    if (index === 0) return 'gold';
    if (index === 1) return 'silver';
    if (index === 2) return 'bronze';
    return '';
  };
  
  return (
    <div className="leaderboard-panel" style={{ width: '400px' }}>
      <div className="card" style={{ height: '100%' }}>
        <div className="mb-4">
          <h2 className="text-accent" style={{ fontSize: '1.25rem', fontWeight: '400' }}>
            leaderboard
          </h2>
          <p className="text-dim" style={{ fontSize: '0.75rem' }}>
            live rankings • {sortedPlayers.length} players
          </p>
        </div>
        
        {sortedPlayers.length === 0 ? (
          <div className="text-center p-4">
            <div className="text-dim mb-2">no players yet</div>
            <p className="text-dim" style={{ fontSize: '0.75rem' }}>
              waiting for players...
            </p>
          </div>
        ) : (
          <div className="gap-3" style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.username}
                className="leaderboard-item"
                style={{
                  backgroundColor: player.username === currentUser ? 'var(--sub-alt-color)' : 'transparent',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: player.username === currentUser ? '1px solid var(--main-color)' : '1px solid var(--sub-color)'
                }}
              >
                {/* Player Info Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`leaderboard-rank ${getRankClass(index)}`}
                      style={{
                        fontSize: '1.25rem',
                        minWidth: '35px',
                        textAlign: 'center'
                      }}
                    >
                      {getRankDisplay(index)}
                    </div>
                    <div>
                      <div className="text-bright" style={{ fontSize: '0.75rem' }}>
                        {player.username}
                        {player.username === currentUser && (
                          <span className="text-accent ml-2" style={{ fontSize: '0.65rem' }}>
                            (you)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex gap-3">
                    <div className="text-center">
                      <div className="text-bright" style={{ fontSize: '1rem', fontWeight: '600' }}>
                        {player.progress || 0}%
                      </div>
                      <div className="text-dim" style={{ fontSize: '0.625rem' }}>PROGRESS</div>
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="progress-container">
                  <div
                    className="progress-bar-mini"
                    style={{
                      height: '10px',
                      backgroundColor: 'var(--sub-color)',
                      borderRadius: '5px',
                      overflow: 'hidden',
                      position: 'relative',
                      width: '100%'
                    }}
                  >
                    <div
                      className="progress-fill-mini"
                      style={{
                        width: `${player.progress || 0}%`,
                        height: '100%',
                        backgroundColor: index === 0 ? 'var(--main-color)' :
                                       index === 1 ? 'var(--text-color)' :
                                       index === 2 ? '#cd7f32' : 'var(--sub-alt-color)',
                        transition: 'width 0.3s ease',
                        borderRadius: '5px'
                      }}
                    />
                  </div>
                  <div className="text-dim text-center mt-2" style={{ fontSize: '0.625rem' }}>
                    {player.progress || 0}% complete
                  </div>
                </div>
                
                {/* Typing Status */}
                {player.isTyping && (
                  <div className="text-center mt-2">
                    <span className="text-accent" style={{ fontSize: '0.625rem' }}>
                      typing...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Room Statistics */}
        {sortedPlayers.length > 0 && (
          <div className="mt-4 p-3" style={{
            backgroundColor: 'var(--bg-color)',
            borderRadius: '0.5rem'
          }}>
            <h3 className="text-bright mb-2" style={{ fontSize: '0.875rem' }}>
              room statistics
            </h3>
            <div className="gap-1" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between text-dim" style={{ fontSize: '0.75rem' }}>
                <span>average progress</span>
                <span className="text-bright">
                  {Math.round(sortedPlayers.reduce((sum, p) => sum + (p.progress || 0), 0) / sortedPlayers.length)}%
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <p className="text-dim" style={{ fontSize: '0.625rem', opacity: 0.7 }}>
            updates in real-time
          </p>
        </div>
      </div>
    </div>
  );
}