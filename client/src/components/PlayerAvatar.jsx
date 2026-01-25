/**
 * Player avatar with crown for founder
 */
export function PlayerAvatar({ player, size = 'normal', showStatus = false }) {
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    normal: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-lg'
  };
  
  const initial = player.name?.charAt(0).toUpperCase() || '?';
  
  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Crown for founder */}
      {player.isFounder && (
        <div className="absolute -top-3 text-game-gold text-lg">
          👑
        </div>
      )}
      
      {/* Avatar circle */}
      <div className={`
        ${sizeClasses[size]}
        rounded-full bg-game-purple flex items-center justify-center
        font-bold text-white border-2 border-white/30
        ${!player.isConnected ? 'opacity-50' : ''}
      `}>
        {initial}
      </div>
      
      {/* Name */}
      <div className={`
        text-white text-center truncate max-w-[80px]
        ${size === 'small' ? 'text-xs' : 'text-sm'}
      `}>
        {player.name}
      </div>
      
      {/* Status indicator */}
      {showStatus && (
        <div className={`
          w-2 h-2 rounded-full absolute bottom-4 right-0
          ${player.isConnected ? 'bg-game-green' : 'bg-gray-500'}
        `} />
      )}
    </div>
  );
}

/**
 * Player list for lobby and other views
 */
export function PlayerList({ players, currentPlayerId }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {players.map(player => (
        <div
          key={player.id}
          className={`
            p-3 rounded-xl bg-white/5 border border-white/10
            ${player.id === currentPlayerId ? 'ring-2 ring-game-purple' : ''}
          `}
        >
          <PlayerAvatar player={player} showStatus />
        </div>
      ))}
    </div>
  );
}
