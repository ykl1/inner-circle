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
      {player.isFounder && (
        <div className="absolute -top-3 text-lg" style={{ color: 'var(--color-text-primary)' }}>
          👑
        </div>
      )}
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold border-2`}
        style={{
          background: 'var(--color-brand)',
          color: 'var(--color-text-primary)',
          borderColor: 'var(--color-border-subtle)',
          opacity: player.isConnected ? 1 : 0.6,
        }}
      >
        {initial}
      </div>
      <div
        className={`text-center truncate max-w-[80px] ${size === 'small' ? 'text-xs' : 'text-sm'}`}
        style={{ color: 'var(--color-text-primary)' }}
      >
        {player.name}
      </div>
      {showStatus && (
        <div
          className="w-2 h-2 rounded-full absolute bottom-4 right-0"
          style={{ background: player.isConnected ? 'var(--color-success)' : 'var(--color-muted)' }}
        />
      )}
    </div>
  );
}

/**
 * Player list for lobby and other views
 */
export function PlayerList({ players, currentPlayerId }) {
  return (
    <div className="flex flex-wrap justify-center" style={{ gap: 'var(--space-md)' }}>
      {players.map(player => (
        <div
          key={player.id}
          className="p-3 rounded-xl"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
            borderColor: player.id === currentPlayerId ? 'var(--color-border-active)' : undefined,
            boxShadow: player.id === currentPlayerId ? '0 0 0 2px var(--color-border-active)' : undefined,
          }}
        >
          <PlayerAvatar player={player} showStatus />
        </div>
      ))}
    </div>
  );
}
