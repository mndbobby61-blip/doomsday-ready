import { useState } from 'react';
import { api, describeError, formatDuration } from '../api.js';
import PrerequisitePicker from '../components/prerequisitePicker.jsx';

const EMPTY_FORM = { title: '', releaseYear: new Date().getFullYear(), runtime: 120, prerequisites: [] };

export default function Movies({ movies, loading, reload, notify }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState([]);

  const titleOf = (id) => movies.find((movie) => movie.id === id)?.title ?? `#${id}`;

  async function addMovie(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.createMovie({
        title: form.title,
        releaseYear: Number(form.releaseYear),
        runtime: Number(form.runtime),
        prerequisites: form.prerequisites,
      });
      setForm(EMPTY_FORM);
      await reload();
      notify('Movie added', 'success');
    } catch (error) {
      notify(describeError(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleWatched(movie) {
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await reload();
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  async function savePrerequisites(movie) {
    try {
      await api.updateMovie(movie.id, { prerequisites: draft });
      setEditingId(null);
      await reload();
      notify('Prerequisites saved', 'success');
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  async function remove(movie) {
    if (!window.confirm(`Delete "${movie.title}"? It will also be removed from other movies' prerequisites.`)) return;
    try {
      await api.deleteMovie(movie.id);
      await reload();
      notify('Movie deleted', 'success');
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  const watchedCount = movies.filter((movie) => movie.watched).length;

  return (
    <div className="stack">
      <section className="panel">
        <h2>Add a movie</h2>
        <form className="form" onSubmit={addMovie}>
          <label className="field wide">
            Title
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Doctor Strange" />
          </label>
          <label className="field">
            Release year
            <input required type="number" min="1888" max="2100" value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} />
          </label>
          <label className="field">
            Runtime (minutes)
            <input required type="number" min="1" max="300" value={form.runtime} onChange={(e) => setForm({ ...form, runtime: e.target.value })} />
          </label>
          <div className="field wide">
            Watch these first (optional)
            <PrerequisitePicker movies={movies} selected={form.prerequisites} onChange={(prerequisites) => setForm({ ...form, prerequisites })} />
          </div>
          <button className="btn primary" disabled={saving}>{saving ? 'Adding…' : 'Add movie'}</button>
        </form>
      </section>

      <section>
        <div className="section-head">
          <h2>Your library</h2>
          <span className="muted">{watchedCount} of {movies.length} watched</span>
        </div>

        {loading && <p className="muted">Loading movies…</p>}
        {!loading && movies.length === 0 && <p className="empty">No movies yet. Add the first one above.</p>}

        <ul className="list">
          {movies.map((movie) => (
            <li key={movie.id} className={`movie ${movie.watched ? 'is-watched' : ''}`}>
              <label className="tick">
                <input type="checkbox" checked={movie.watched} onChange={() => toggleWatched(movie)} />
                <span className="tick-box" aria-hidden="true" />
                <span className="sr-only">Mark {movie.title} as watched</span>
              </label>

              <div className="movie-main">
                <h3>{movie.title}</h3>
                <p className="muted">{movie.releaseYear}, {formatDuration(movie.runtime)}</p>
                {movie.prerequisites.length > 0 && (
                  <p className="needs">Needs: {movie.prerequisites.map(titleOf).join(', ')}</p>
                )}

                {editingId === movie.id && (
                  <div className="editor">
                    <PrerequisitePicker movies={movies} excludeId={movie.id} selected={draft} onChange={setDraft} />
                    <div className="row">
                      <button className="btn primary small" onClick={() => savePrerequisites(movie)}>Save prerequisites</button>
                      <button className="btn ghost small" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="row actions">
                <button className="btn ghost small" onClick={() => { setEditingId(movie.id); setDraft(movie.prerequisites); }}>
                  Edit prerequisites
                </button>
                <button className="btn danger small" onClick={() => remove(movie)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}