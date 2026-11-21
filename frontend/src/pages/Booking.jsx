import { useEffect, useState } from 'react';
import { api, describeError } from '../api.js';
import AuditoriumPreview from '../components/AuditoriumPreview.jsx';

const PRESETS = [6, 11, 20, 44, 100];

export default function Booking({ notify }) {
  const [cinemas, setCinemas] = useState([]);
  const [cinemaId, setCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newCinema, setNewCinema] = useState({ name: '', sizes: '' });

  async function loadCinemas(selectId) {
    try {
      const list = await api.listCinemas();
      setCinemas(list);
      setCinemaId((current) => selectId ?? (current || String(list[0]?.id ?? '')));
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  useEffect(() => {
    loadCinemas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = cinemas.find((cinema) => String(cinema.id) === String(cinemaId));

  async function fetchQuote(size) {
    setLoading(true);
    try {
      setQuote(await api.booking(cinemaId, size));
    } catch (error) {
      setQuote(null);
      notify(describeError(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    fetchQuote(groupSize);
  }

  function pickPreset(size) {
    setGroupSize(String(size));
    fetchQuote(size);
  }

  async function addCinema(event) {
    event.preventDefault();
    const bundleSizes = newCinema.sizes.split(',').map((s) => s.trim()).filter(Boolean).map(Number);
    try {
      const created = await api.createCinema({ name: newCinema.name, bundleSizes });
      setNewCinema({ name: '', sizes: '' });
      setAdding(false);
      await loadCinemas(String(created.id));
      setQuote(null);
      notify('Cinema added', 'success');
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  async function copySummary() {
    const parts = quote.bundles.map((bundle) => `${bundle.size} x ${bundle.count}`).join(', ');
    const text = `${quote.cinema.name}: ${quote.groupSize} seats = ${parts} (${quote.totalBundles} bundles)`;
    try {
      await navigator.clipboard.writeText(text);
      notify('Copied to clipboard', 'success');
    } catch {
      notify('Could not copy. Select the text manually.', 'error');
    }
  }

  // "20 + 9 + 9 + 6 = 44", but only when it stays short enough to read.
  const equation =
    quote?.possible && quote.totalBundles <= 12
      ? `${quote.bundles.flatMap((bundle) => Array(bundle.count).fill(bundle.size)).join(' + ')} = ${quote.groupSize}`
      : null;

  return (
    <div className="stack">
      <section className="panel">
        <h2>Book opening night</h2>

        <div className="field">
          Cinema
          <div className="chips" role="group" aria-label="Cinema">
            {cinemas.map((cinema) => (
              <button
                type="button"
                key={cinema.id}
                className="chip"
                aria-pressed={String(cinema.id) === String(cinemaId)}
                onClick={() => { setCinemaId(String(cinema.id)); setQuote(null); }}
              >
                {cinema.name}
              </button>
            ))}
          </div>
          {selected && (
            <div className="bundle-tags" aria-label="Bundle sizes">
              {selected.bundleSizes.map((size) => <span key={size}>{size} seats</span>)}
            </div>
          )}
        </div>

        <form className="booking-form" onSubmit={submit}>
          <label className="field">
            Group size (1 to 10,000)
            <input required type="number" min="1" max="10000" value={groupSize} onChange={(event) => setGroupSize(event.target.value)} placeholder="44" />
          </label>
          <button className="btn primary" disabled={loading || !cinemaId}>{loading ? 'Working it out…' : 'Get my bundles'}</button>
        </form>

        <div className="chips" aria-label="Quick group sizes">
          <span className="muted">Try:</span>
          {PRESETS.map((size) => (
            <button type="button" key={size} className="chip" disabled={!cinemaId} onClick={() => pickPreset(size)}>{size}</button>
          ))}
        </div>
      </section>

      {quote && quote.possible && (
        <section className="panel">
          <div className="section-head">
            <h2>{quote.totalBundles} {quote.totalBundles === 1 ? 'bundle' : 'bundles'} for {quote.groupSize} seats</h2>
            <button className="btn ghost small" onClick={copySummary}>Copy summary</button>
          </div>
          {equation && <p className="equation">{equation}</p>}
          <ul className="tickets">
            {quote.bundles.map((bundle, index) => (
              <li key={bundle.size} className="ticket" style={{ animationDelay: `${index * 90}ms` }}>
                <span className="ticket-size">{bundle.size}</span>
                <span className="ticket-label">seat bundle</span>
                <span className="ticket-count">× {bundle.count}</span>
              </li>
            ))}
          </ul>
          <p className="muted">Fewest bundles possible, and nobody pays for an empty seat.</p>
          <AuditoriumPreview quote={quote} />
        </section>
      )}

      {quote && !quote.possible && (
        <section className="panel notice" role="status">
          <h2>Not possible</h2>
          <p>{quote.message} Try a different group size or another cinema.</p>
        </section>
      )}

      <section>
        {!adding ? (
          <button className="btn ghost" onClick={() => setAdding(true)}>+ Add a cinema</button>
        ) : (
          <form className="panel two" onSubmit={addCinema}>
            <h2 className="span-all">New cinema</h2>
            <label className="field">
              Name
              <input required value={newCinema.name} onChange={(event) => setNewCinema({ ...newCinema, name: event.target.value })} />
            </label>
            <label className="field">
              Bundle sizes, separated by commas
              <input required value={newCinema.sizes} onChange={(event) => setNewCinema({ ...newCinema, sizes: event.target.value })} placeholder="6, 9, 20" />
            </label>
            <div className="row span-all">
              <button className="btn primary">Save cinema</button>
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}