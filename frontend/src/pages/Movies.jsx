import { useMemo, useState } from 'react';
import { api, describeError, formatDuration } from '../api.js';
import MovieDialog from '../components/MovieDialog.jsx';
import Poster from '../components/Poster.jsx';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unwatched', label: 'To watch' },
  { id: 'watched', label: 'Watched' },
];

const SORTS = {
  year: (a, b) => a.releaseYear - b.releaseYear || a.id - b.id,
  title: (a, b) => a.title.localeCompare(b.title),
  runtime: (a, b) => b.runtime - a.runtime,
};

export default function Movies({ movies, loading, reload, notify }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('year');
  const [dialog, setDialog] = useState(null); // null | { movie: object | null }

  const stats = useMemo(() => {
    const byId = new Map(movies.map((movie) => [movie.id, movie]));
    const unwatched = movies.filter((movie) => !movie.watched);
    // "Next up" = the first unwatched movie whose prerequisites are all watched.
    const next = [...unwatched]
      .sort(SORTS.year)
      .find((movie) => movie.prerequisites.every((id) => byId.get(id)?.watched));
    return {
      total: movies.length,
      watched: movies.length - unwatched.length,
      minutesLeft: unwatched.reduce((sum, movie) => sum + movie.runtime, 0),
      next,
    };
  }, [movies]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return movies
      .filter((movie) => (filter === 'all' ? true : filter === 'watched' ? movie.watched : !movie.watched))
      .filter((movie) => !text || movie.title.toLowerCase().includes(text))
      .sort(SORTS[sort]);
  }, [movies, query, filter, sort]);

  async function toggleWatched(movie) {
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await reload();
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  const percent = stats.total ? Math.round((stats.watched / stats.total) * 100) : 0;

  return (
    <div className="stack">
      <section className="stats">
        <article className="stat">
          <span className="stat-label">Library</span>
          <strong>{stats.total}</strong>
          <small>movies tracked</small>
        </article>
        <article className="stat">
          <span className="stat-label">Watched</span>
          <strong>{stats.watched}<em>/{stats.total}</em></strong>
          <div className="mini-bar"><i style={{ width: `${percent}%` }} /></div>
        </article>
        <article className="stat">
          <span className="stat-label">Time left</span>
          <strong>{formatDuration(stats.minutesLeft)}</strong>
          <small>of unwatched movies</small>
        </article>
        <article className="stat accent">
          <span className="stat-label">Next up</span>
          <strong className="stat-title">{stats.next ? stats.next.title : 'All caught up'}</strong>
          <small>{stats.next ? 'Ready to watch now' : 'Nothing left to watch'}</small>
        </article>
      </section>

      <section className="toolbar">
        <input
          className="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search movies…"
          aria-label="Search movies"
        />
        <div className="segmented" role="group" aria-label="Filter">
          {FILTERS.map(({ id, label }) => (
            <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort movies">
          <option value="year">Release year</option>
          <option value="title">Title</option>
          <option value="runtime">Longest first</option>
        </select>
        <button className="btn primary" onClick={() => setDialog({ movie: null })}>+ Add movie</button>
      </section>

      {loading && <p className="muted">Loading movies…</p>}
      {!loading && movies.length === 0 && <p className="empty">No movies yet. Add the first one.</p>}
      {!loading && movies.length > 0 && visible.length === 0 && <p className="empty">No movies match your search.</p>}

      <ul className="grid">
        {visible.map((movie, index) => (
          <li key={movie.id} className="card" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
            <Poster movie={movie} badge={movie.watched ? '✓ Watched' : null} onClick={() => setDialog({ movie })} />
            <div className="card-foot">
              <div className="row" style={{ gap: '0.4rem', alignItems: 'center' }}>
                <span className="muted">{formatDuration(movie.runtime)}</span>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' Marvel official trailer')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trailer-link"
                  title={`Watch ${movie.title} trailer`}
                  onClick={(e) => e.stopPropagation()}
                >
                  ▶
                </a>
              </div>
              <label className="tick" title={movie.watched ? 'Mark as not watched' : 'Mark as watched'}>
                <input type="checkbox" checked={movie.watched} onChange={() => toggleWatched(movie)} />
                <span className="tick-box" aria-hidden="true" />
                <span className="sr-only">Mark {movie.title} as watched</span>
              </label>
            </div>
          </li>
        ))}
      </ul>

      {dialog && (
        <MovieDialog
          movie={dialog.movie}
          movies={movies}
          onClose={() => setDialog(null)}
          onChanged={reload}
          notify={notify}
        />
      )}
    </div>
  );
}