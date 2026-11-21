import { useState } from 'react';
import { api, describeError } from '../api.js';
import PrerequisitePicker from './PrerequisitePicker.jsx';
import Poster from './Poster.jsx';
import useEscape from './useEscape.js';

/** One dialog for both adding a new movie and editing an existing one. */
export default function MovieDialog({ movie, movies, onClose, onChanged, notify }) {
  const isEdit = Boolean(movie);
  const [form, setForm] = useState(() => ({
    title: movie?.title ?? '',
    releaseYear: movie?.releaseYear ?? new Date().getFullYear(),
    runtime: movie?.runtime ?? 120,
    posterUrl: movie?.posterUrl ?? '',
    prerequisites: movie?.prerequisites ?? [],
  }));
  const [watched, setWatched] = useState(movie?.watched ?? false);
  const [busy, setBusy] = useState(false);

  useEscape(onClose);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const body = {
      title: form.title,
      releaseYear: Number(form.releaseYear),
      runtime: Number(form.runtime),
      posterUrl: form.posterUrl,
      prerequisites: form.prerequisites,
    };
    try {
      if (isEdit) await api.updateMovie(movie.id, body);
      else await api.createMovie({ ...body, watched });
      await onChanged();
      notify(isEdit ? 'Movie updated' : 'Movie added', 'success');
      onClose();
    } catch (error) {
      notify(describeError(error), 'error');
      setBusy(false);
    }
  }

  async function toggleWatched() {
    if (!isEdit) {
      setWatched((value) => !value);
      return;
    }
    try {
      await api.updateMovie(movie.id, { watched: !watched });
      setWatched(!watched);
      await onChanged();
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${movie.title}"? It will also be removed from other movies' prerequisites.`)) return;
    try {
      await api.deleteMovie(movie.id);
      await onChanged();
      notify('Movie deleted', 'success');
      onClose();
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  const preview = { title: form.title || 'Untitled', releaseYear: form.releaseYear, posterUrl: form.posterUrl };

  return (
    <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal movie-modal" role="dialog" aria-modal="true" aria-labelledby="movie-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <div className="movie-modal-poster">
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent((form.title || 'Marvel') + ' official trailer')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn ghost small"
            style={{ textAlign: 'center', marginBottom: '0.5rem', width: '100%' }}
          >
            🎬 Official Trailer ↗
          </a>
          <Poster movie={preview} />
          <label className="check-line">
            <input type="checkbox" checked={watched} onChange={toggleWatched} />
            <span>{watched ? 'Watched' : 'Not watched yet'}</span>
          </label>
        </div>

        <form className="movie-modal-form" onSubmit={submit}>
          <h2 id="movie-title">{isEdit ? 'Edit movie' : 'Add a movie'}</h2>

          <label className="field">
            Title
            <input required value={form.title} onChange={set('title')} placeholder="Doctor Strange" />
          </label>
          <div className="two">
            <label className="field">
              Release year
              <input required type="number" min="1888" max="2100" value={form.releaseYear} onChange={set('releaseYear')} />
            </label>
            <label className="field">
              Runtime (minutes)
              <input required type="number" min="1" max="300" value={form.runtime} onChange={set('runtime')} />
            </label>
          </div>
          <label className="field">
            Poster link (optional)
            <input type="url" value={form.posterUrl} onChange={set('posterUrl')} placeholder="https://…/poster.jpg" />
          </label>
          <div className="field">
            Watch these first
            <PrerequisitePicker
              movies={movies}
              excludeId={movie?.id}
              selected={form.prerequisites}
              onChange={(prerequisites) => setForm({ ...form, prerequisites })}
            />
          </div>

          <div className="row end">
            {isEdit && <button type="button" className="btn danger" onClick={remove}>Delete</button>}
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add movie'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}