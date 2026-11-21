import { useRef, useState } from 'react';

function hashOf(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** "Avengers: Infinity War" -> "AIW", "The Avengers" -> "A" */
function initialsOf(title) {
  return title
    .replace(/^(the|a|an)\s+/i, '')
    .split(/[\s:–-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/**
 * A movie poster. Uses the movie's posterUrl when there is one, otherwise it
 * paints original artwork: a gradient whose colors come from the title, so
 * every movie always looks different and the same every time.
 */
export default function Poster({ movie, onClick, badge, className = '', decorative = false }) {
  const ref = useRef(null);
  const [broken, setBroken] = useState(false);

  const seed = hashOf(movie.title);
  const hue1 = seed % 360;
  const hue2 = (hue1 + 40 + ((seed >> 3) % 90)) % 360;
  const showImage = movie.posterUrl && !broken;

  function tilt(event) {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
  }

  function reset() {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  }

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      ref={ref}
      type={onClick ? 'button' : undefined}
      className={`poster ${className}`}
      style={{ '--h1': hue1, '--h2': hue2 }}
      onClick={onClick}
      onMouseMove={tilt}
      onMouseLeave={reset}
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={onClick && !decorative ? `Open ${movie.title}` : undefined}
    >
      {showImage ? (
        <img src={movie.posterUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      ) : (
        <span className="poster-art" aria-hidden="true">{initialsOf(movie.title)}</span>
      )}
      <span className="poster-shine" aria-hidden="true" />
      <span className="poster-caption">
        <strong>{movie.title}</strong>
        <small>{movie.releaseYear}</small>
      </span>
      {badge && <span className="poster-badge">{badge}</span>}
    </Tag>
  );
}