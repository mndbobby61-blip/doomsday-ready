import { useMemo } from 'react';

/**
 * Visual interactive Dependency Graph (DAG) for the rewatch order.
 * Shows each movie node, its prerequisite connections, and watch status.
 */
export default function DependencyGraph({ targetMovie, order, onToggleWatched }) {
  // Map movie ID to movie object
  const movieMap = useMemo(() => {
    const map = new Map();
    if (order) order.forEach((m) => map.set(m.id, m));
    if (targetMovie) map.set(targetMovie.id, targetMovie);
    return map;
  }, [order, targetMovie]);

  if (!order || order.length === 0) {
    return (
      <div className="dag-empty">
        <p className="muted">No prerequisite dependencies. You can watch this movie directly!</p>
      </div>
    );
  }

  return (
    <div className="dag-container">
      <div className="dag-header">
        <span className="dag-badge">Prerequisite Flow Graph</span>
        <span className="muted">Follow the arrows to watch in logical saga order</span>
      </div>

      <div className="dag-tree">
        {order.map((movie, index) => {
          const prereqNames = (movie.prerequisites || [])
            .map((id) => movieMap.get(id)?.title)
            .filter(Boolean);

          return (
            <div key={movie.id} className="dag-node-wrapper">
              <div className={`dag-node ${movie.watched ? 'is-watched' : ''}`}>
                <div className="dag-node-step">{index + 1}</div>
                <div className="dag-node-content">
                  <div className="dag-node-title-row">
                    <h4>{movie.title}</h4>
                    <span className="dag-node-year">{movie.releaseYear}</span>
                  </div>
                  {prereqNames.length > 0 && (
                    <div className="dag-node-prereqs">
                      <span className="dag-label">Unlocks after:</span>
                      <div className="dag-pills">
                        {prereqNames.map((name) => (
                          <span key={name} className="dag-pill">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={`dag-check-btn ${movie.watched ? 'checked' : ''}`}
                  onClick={() => onToggleWatched(movie)}
                  title={movie.watched ? 'Mark as unwatched' : 'Mark as watched'}
                  aria-label={`Toggle watched status for ${movie.title}`}
                >
                  {movie.watched ? '✓ Done' : '○ Pending'}
                </button>
              </div>

              {/* Connecting flow arrow to next stage */}
              <div className="dag-arrow" aria-hidden="true">
                <span className="dag-arrow-line" />
                <span className="dag-arrow-head">▼</span>
              </div>
            </div>
          );
        })}

        {/* Final Target Destination */}
        {targetMovie && (
          <div className="dag-target-node">
            <div className="dag-target-badge">🎯 TARGET PREMIERE</div>
            <h3>{targetMovie.title}</h3>
            <p className="muted">
              {targetMovie.releaseYear} • Ready once all above {order.length} prerequisites are complete!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
