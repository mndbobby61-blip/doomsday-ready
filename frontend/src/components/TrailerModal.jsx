import useEscape from './useEscape.js';

export default function TrailerModal({ movie, onClose }) {
  useEscape(onClose);

  if (!movie) return null;

  const searchQuery = encodeURIComponent(`${movie.title} Marvel official trailer`);
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal trailer-modal" role="dialog" aria-modal="true" aria-labelledby="trailer-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="trailer-header">
          <span className="trailer-badge">🎬 Official Trailer</span>
          <h2 id="trailer-title">{movie.title} ({movie.releaseYear})</h2>
          <p className="muted">Catch the hype and refresh your memory before the premiere.</p>
        </div>

        <div className="trailer-body">
          <div className="trailer-placeholder">
            <span className="trailer-icon" aria-hidden="true">▶️</span>
            <h3>Watch Trailer on YouTube</h3>
            <p>Opens official high-definition trailer in a new tab</p>
            <a
              href={youtubeSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn primary big"
            >
              Search & Play Trailer ↗
            </a>
          </div>
        </div>

        <div className="row end">
          <button type="button" className="btn ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
