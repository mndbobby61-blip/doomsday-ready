import { useCallback, useEffect, useState } from 'react';
import { api, describeError } from './api.js';
import Toast from './components/Toast.jsx';
import Booking from './pages/Booking.jsx';
import Movies from './pages/Movies.jsx';
import RewatchPlan from './pages/RewatchPlan.jsx';

const TABS = [
  { id: 'movies', label: 'Movies' },
  { id: 'rewatch', label: 'Rewatch plan' },
  { id: 'booking', label: 'Booking' },
];

export default function App() {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const closeToast = useCallback(() => setToast(null), []);
  const notify = useCallback((message, tone = 'info') => setToast({ message, tone, key: Date.now() }), []);

  const reloadMovies = useCallback(async () => {
    try {
      setMovies(await api.listMovies());
    } catch (error) {
      notify(describeError(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    reloadMovies();
  }, [reloadMovies]);

  return (
    <div className="shell">
      <header className="masthead">
        <div>
          <h1>Doomsday Ready</h1>
          <p>Catch up on the saga, then book the whole crew into opening night.</p>
        </div>
        <nav className="tabs" aria-label="Sections">
          {TABS.map(({ id, label }) => (
            <button key={id} className="tab" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'movies' && <Movies movies={movies} loading={loading} reload={reloadMovies} notify={notify} />}
        {tab === 'rewatch' && <RewatchPlan movies={movies} reload={reloadMovies} notify={notify} />}
        {tab === 'booking' && <Booking notify={notify} />}
      </main>

      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}