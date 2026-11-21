import { useCallback, useEffect, useRef, useState } from 'react';
import { api, describeError, formatDuration } from '../api.js';
import Confetti from '../components/Confetti.jsx';
import DependencyGraph from '../components/DependencyGraph.jsx';
import Poster from '../components/Poster.jsx';

const RING = 2 * Math.PI * 52; // circumference of the progress ring (r = 52)

export default function RewatchPlan({ movies, reload, notify }) {
  const [targetId, setTargetId] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'graph'
  const [celebrate, setCelebrate] = useState(false);
  const wasComplete = useRef(null);

  // Default to the newest movie: the one fans are preparing for.
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

  // Confetti only when the plan turns complete while you are looking at it.
  useEffect(() => {
    if (!plan) return;
    const complete = plan.totalCount > 0 && plan.watchedCount === plan.totalCount;
    if (wasComplete.current === false && complete) setCelebrate(true);
    wasComplete.current = complete;
  }, [plan]);

  async function toggleWatched(movie) {
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await reload();
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  async function markAllWatched() {
    try {
      await Promise.all(plan.order.filter((movie) => !movie.watched).map((movie) => api.updateMovie(movie.id, { watched: true })));
      await reload();
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  const percent = plan && plan.totalCount > 0 ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 0;
  const days = plan && plan.remainingRuntime > 0 ? Math.ceil(plan.remainingRuntime / 60 / Math.max(hoursPerDay, 0.5)) : 0;
  const ready = plan && plan.remainingRuntime === 0;

  return (
    <div className="stack">
      <section className="panel">
        <h2>Pick your target</h2>
        <label className="field">
          Movie you want to be ready for
          <select
            value={targetId}
            onChange={(event) => {
              wasComplete.current = null;
              setTargetId(event.target.value);
            }}
          >
            {movies.length === 0 && <option value="">No movies yet</option>}
            {movies.map((movie) => (
              <option key={movie.id} value={movie.id}>{movie.title} ({movie.releaseYear})</option>
            ))}
          </select>
        </label>
      </section>

      {loading && !plan && <p className="muted">Building your plan…</p>}

      {plan && (
        <>
          <section className="panel summary">
            <div className="ring" role="progressbar" aria-valuemin={0} aria-valuemax={plan.totalCount} aria-valuenow={plan.watchedCount} aria-label="Watched progress">
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <defs>
                  <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" />
                    <stop offset="100%" stopColor="#19d3c5" />
                  </linearGradient>
                </defs>
                <circle className="ring-bg" cx="60" cy="60" r="52" />
                <circle className="ring-fg" cx="60" cy="60" r="52" strokeDasharray={`${(percent / 100) * RING} ${RING}`} />
              </svg>
              <div className="ring-text">
                <strong>{percent}%</strong>
                <small>{plan.watchedCount} of {plan.totalCount} watched</small>
              </div>
            </div>

            <div className="summary-info">
              <h2>Before {plan.target.title}</h2>
              {ready ? (
                <p className="ready">🎉 You are Doomsday Ready. Nothing left to watch!</p>
              ) : (
                <>
                  <p className="muted">{formatDuration(plan.remainingRuntime)} of watching left</p>
                  <label className="inline-field">
                    Hours per day
                    <input type="number" min="0.5" max="12" step="0.5" value={hoursPerDay} onChange={(event) => setHoursPerDay(Number(event.target.value) || 1)} />
                  </label>
                  <p className="eta">About <strong>{days}</strong> {days === 1 ? 'day' : 'days'} to finish at {hoursPerDay}h a day</p>
                  <button className="btn ghost small" onClick={markAllWatched}>Mark all as watched</button>
                </>
              )}
            </div>
          </section>

          {plan.totalCount > 0 && (
            <div className="section-head" style={{ marginBottom: '1rem' }}>
              <span className="muted">View mode:</span>
              <div className="segmented" role="group" aria-label="View mode">
                <button
                  type="button"
                  aria-pressed={viewMode === 'timeline'}
                  onClick={() => setViewMode('timeline')}
                >
                  Timeline View
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'graph'}
                  onClick={() => setViewMode('graph')}
                >
                  Graph Flow View
                </button>
              </div>
            </div>
          )}

          {plan.totalCount === 0 ? (
            <p className="empty">No prerequisites. You can watch this one right now.</p>
          ) : viewMode === 'graph' ? (
            <DependencyGraph
              targetMovie={movies.find((m) => String(m.id) === String(targetId))}
              order={plan.order}
              onToggleWatched={toggleWatched}
            />
          ) : (
            <ol className="timeline">
              {plan.order.map((movie, index) => (
                <li key={movie.id} className={movie.watched ? 'is-watched' : ''} style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}>
                  <span className="step">{index + 1}</span>
                  <Poster movie={movie} className="poster-sm" />
                  <div className="timeline-info">
                    <h3>{movie.title}</h3>
                    <p className="muted">{movie.releaseYear}, {formatDuration(movie.runtime)}</p>
                  </div>
                  <label className="tick">
                    <input type="checkbox" checked={movie.watched} onChange={() => toggleWatched(movie)} />
                    <span className="tick-box" aria-hidden="true" />
                    <span className="sr-only">Mark {movie.title} as watched</span>
                  </label>
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {celebrate && <Confetti onDone={() => setCelebrate(false)} />}
    </div>
  );
}