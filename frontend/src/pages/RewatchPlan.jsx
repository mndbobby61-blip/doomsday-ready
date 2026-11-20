import { useCallback, useEffect, useState } from 'react';
import { api, describeError, formatDuration } from '../api.js';

export default function RewatchPlan({ movies, reload, notify }) {
  const [targetId, setTargetId] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // ডিফল্টে সবচেয়ে নতুন মুভি (যার জন্য ফ্যানরা তৈরি হচ্ছে)
  useEffect(() => {
    if (!targetId && movies.length > 0) setTargetId(String(movies[movies.length - 1].id));
  }, [movies, targetId]);

  const load = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      setPlan(await api.rewatchOrder(targetId));
    } catch (error) {
      setPlan(null);
      notify(describeError(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [targetId, notify]);

  useEffect(() => {
    load();
  }, [load, movies]);

  async function toggleWatched(movie) {
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await reload();
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  const percent = plan && plan.totalCount > 0 ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 0;

  return (
    <div className="stack">
      <section className="panel">
        <h2>Pick your target</h2>
        <label className="field">
          Movie you want to be ready for
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            {movies.length === 0 && <option value="">No movies yet</option>}
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>{movie.title} ({movie.releaseYear})</option>
            ))}
          </select>
        </label>
      </section>

      {loading && !plan && <p className="muted">Building your plan…</p>}

      {plan && (
        <section className="panel">
          <div className="section-head">
            <h2>Before {plan.target.title}</h2>
            <span className="muted">{plan.remainingRuntime > 0 ? `${formatDuration(plan.remainingRuntime)} left to watch` : 'Nothing left to watch'}</span>
          </div>

          {plan.totalCount === 0 ? (
            <p className="empty">No prerequisites. You can watch this one right now.</p>
          ) : (
            <>
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={plan.totalCount} aria-valuenow={plan.watchedCount} aria-label="Watched progress">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <p className="progress-label">{plan.watchedCount} of {plan.totalCount} watched</p>

              <ol className="reel">
                {plan.order.map((movie) => (
                  <li key={movie.id} className={movie.watched ? 'is-watched' : ''}>
                    <label className="tick">
                      <input type="checkbox" checked={movie.watched} onChange={() => toggleWatched(movie)} />
                      <span className="tick-box" aria-hidden="true" />
                      <span className="sr-only">Mark {movie.title} as watched</span>
                    </label>
                    <div>
                      <h3>{movie.title}</h3>
                      <p className="muted">{movie.releaseYear}, {formatDuration(movie.runtime)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}
    </div>
  );
}