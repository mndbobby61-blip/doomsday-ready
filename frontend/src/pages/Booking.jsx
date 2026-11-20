import { useEffect, useState } from 'react';
import { api, describeError } from '../api.js';

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
      setCinemaId((current) => selectId ?? current ?? String(list[0]?.id ?? ''));
    } catch (error) {
      notify(describeError(error), 'error');
    }
  }

  useEffect(() => {
    loadCinemas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!cinemaId && cinemas.length > 0) setCinemaId(String(cinemas[0].id));
  }, [cinemas, cinemaId]);

  const selected = cinemas.find((cinema) => String(cinema.id) === String(cinemaId));

  async function getQuote(event) {
    event.preventDefault();
    setLoading(true);
    try {
      setQuote(await api.booking(cinemaId, groupSize));
    } catch (error) {
      setQuote(null);
      notify(describeError(error), 'error');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="stack">
      <section className="panel">
        <h2>Book opening night</h2>
        <form className="form" onSubmit={getQuote}>
          <label className="field wide">
            Cinema
            <select value={cinemaId} onChange={(e) => { setCinemaId(e.target.value); setQuote(null); }}>
              {cinemas.map((cinema) => (
                <option key={cinema.id} value={cinema.id}>{cinema.name}</option>
              ))}
            </select>
          </label>
          {selected && (
            <p className="muted wide">Sells bundles of {selected.bundleSizes.join(', ')} seats.</p>
          )}
          <label className="field">
            Group size (1 to 10,000)
            <input required type="number" min="1" max="10000" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} placeholder="44" />
          </label>
          <button className="btn primary" disabled={loading || !cinemaId}>{loading ? 'Working it out…' : 'Get my bundles'}</button>
        </form>
      </section>

      {quote && quote.possible && (
        <section className="panel">
          <div className="section-head">
            <h2>{quote.totalBundles} {quote.totalBundles === 1 ? 'bundle' : 'bundles'} for {quote.groupSize} seats</h2>
            <span className="muted">Fewest bundles, no empty seats</span>
          </div>
          <ul className="tickets">
            {quote.bundles.map((bundle) => (
              <li key={bundle.size} className="ticket">
                <span className="ticket-size">{bundle.size}</span>
                <span className="ticket-label">seat bundle</span>
                <span className="ticket-count">× {bundle.count}</span>
              </li>
            ))}
          </ul>
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
          <button className="btn ghost" onClick={() => setAdding(true)}>Add a cinema</button>
        ) : (
          <form className="panel form" onSubmit={addCinema}>
            <h2 className="wide">New cinema</h2>
            <label className="field">
              Name
              <input required value={newCinema.name} onChange={(e) => setNewCinema({ ...newCinema, name: e.target.value })} />
            </label>
            <label className="field">
              Bundle sizes, separated by commas
              <input required value={newCinema.sizes} onChange={(e) => setNewCinema({ ...newCinema, sizes: e.target.value })} placeholder="6, 9, 20" />
            </label>
            <div className="row">
              <button className="btn primary">Save cinema</button>
              <button type="button" className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}