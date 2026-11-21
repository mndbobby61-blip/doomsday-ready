import { useEffect, useState } from 'react';

const COLORS = ['#7c5cff', '#ff4d8d', '#19d3c5', '#ffb020', '#4da3ff'];

/** A short burst of falling confetti. Calls onDone when finished. */
export default function Confetti({ onDone }) {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, id) => ({
      id,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.6,
      rotate: Math.random() * 360,
      color: COLORS[id % COLORS.length],
    })),
  );

  useEffect(() => {
    const timer = setTimeout(onDone, 4500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <i
          key={piece.id}
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}