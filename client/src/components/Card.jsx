/**
 * Card component for displaying game cards
 */
export function Card({ card, selected = false, onClick, disabled = false, size = 'normal' }) {
  const isGreen = card.type === 'green';
  
  const sizeClasses = {
    small: 'p-2 min-h-[80px]',
    normal: 'p-4 min-h-[120px]',
    large: 'p-6 min-h-[160px]'
  };
  
  return (
    <button
      onClick={() => !disabled && onClick?.(card)}
      disabled={disabled}
      style={{
        border: '2px solid ' + (isGreen ? 'var(--color-success)' : 'var(--color-sab-right)'),
        background: isGreen ? 'rgba(74, 191, 181, 0.2)' : 'rgba(196, 75, 26, 0.2)',
        color: 'var(--color-text-primary)',
        ...(disabled && { opacity: 0.6 }),
      }}
      className={`
        ${sizeClasses[size]}
        w-full rounded-xl transition-all duration-200
        flex flex-col justify-center items-center text-center
        ${selected ? 'ring-4 ring-white scale-105 shadow-lg' : ''}
        ${!disabled && !selected ? 'hover:scale-102 hover:shadow-md cursor-pointer' : ''}
        ${disabled ? 'cursor-not-allowed' : ''}
      `}
    >
      <div className="text-label mb-2" style={{ color: isGreen ? 'var(--color-success)' : 'var(--color-sab-delta)' }}>
        {isGreen ? 'Strength' : 'Flaw'}
      </div>
      <div className="text-body" style={{ color: 'var(--color-text-primary)' }}>
        {card.text}
      </div>
    </button>
  );
}

/**
 * Card display for showing a hand of cards
 */
export function CardHand({ cards, selectedIds = [], onCardClick, disabled = false }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          selected={selectedIds.includes(card.id)}
          onClick={onCardClick}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

/**
 * Pitch hand display (3 cards in a row)
 */
export function PitchHand({ cards, label }) {
  return (
    <div className="space-y-3">
      {label && (
        <div className="text-center text-label" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {cards?.map(card => (
          <Card
            key={card.id}
            card={card}
            size="small"
            disabled
          />
        ))}
      </div>
    </div>
  );
}
