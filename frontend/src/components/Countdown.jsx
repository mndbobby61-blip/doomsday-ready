import { useEffect, useState } from 'react';

// Avengers: Doomsday targeted premiere date (May 1, 2026 UTC)
const TARGET_DATE = new Date('2026-05-01T00:00:00Z').getTime();

export default function Countdown({ compact = false }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  function calculateTimeLeft() {
    const diff = TARGET_DATE - Date.now();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, reached: true };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return { days, hours, minutes, seconds, reached: false };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (compact) {
    return (
      <div className="countdown-compact" title="Avengers: Doomsday premiere countdown">
        <span className="countdown-pulse" />
        <span className="countdown-label">Doomsday in:</span>
        <strong>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</strong>
      </div>
    );
  }

  return (
    <div className="countdown-banner" aria-label="Avengers Doomsday Countdown">
      <div className="countdown-tag">
        <span className="countdown-pulse" />
        <span>PREMIERE COUNTDOWN</span>
      </div>
      <div className="countdown-grid">
        <div className="countdown-slot">
          <strong>{String(timeLeft.days).padStart(2, '0')}</strong>
          <small>Days</small>
        </div>
        <span className="countdown-colon">:</span>
        <div className="countdown-slot">
          <strong>{String(timeLeft.hours).padStart(2, '0')}</strong>
          <small>Hours</small>
        </div>
        <span className="countdown-colon">:</span>
        <div className="countdown-slot">
          <strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>
          <small>Mins</small>
        </div>
        <span className="countdown-colon">:</span>
        <div className="countdown-slot">
          <strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>
          <small>Secs</small>
        </div>
      </div>
    </div>
  );
}
