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
      className={`
        ${sizeClasses[size]}
        w-full rounded-xl border-2 transition-all duration-200
        flex flex-col justify-center items-center text-center
        ${isGreen 
          ? 'bg-green-500/20 border-game-green text-green-100' 
          : 'bg-red-500/20 border-game-red text-red-100'
        }
        ${selected 
          ? 'ring-4 ring-white scale-105 shadow-lg' 
          : ''
        }
        ${!disabled && !selected 
          ? 'hover:scale-102 hover:shadow-md cursor-pointer' 
          : ''
        }
        ${disabled 
          ? 'opacity-60 cursor-not-allowed' 
          : ''
        }
      `}
    >
      <div className={`
        text-xs font-bold uppercase tracking-wider mb-2
        ${isGreen ? 'text-game-green' : 'text-game-red'}
      `}>
        {isGreen ? 'Strength' : 'Flaw'}
      </div>
      <div className="text-sm font-medium">
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
        <div className="text-center text-white/70 text-sm font-medium">
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
