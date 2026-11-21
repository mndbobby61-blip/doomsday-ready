import { useCallback, useEffect, useState } from 'react';
import { api, describeError } from './api.js';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import Countdown from './components/Countdown.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Toast from './components/Toast.jsx';
import Booking from './pages/Booking.jsx';
import Landing from './pages/Landing.jsx';
import Movies from './pages/Movies.jsx';
import RewatchPlan from './pages/RewatchPlan.jsx';

const TABS = [
  { id: 'movies', label: 'Movies' },
  { id: 'rewatch', label: 'Rewatch plan' },
  { id: 'booking', label: 'Booking' },
];

function Shell() {
  const { user, logout } = useAuth();
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

  const initial = (user.name || '?').trim()[0].toUpperCase();

  return (
    <div className="shell">
      <div className="blobs soft" aria-hidden="true"><i /><i /><i /></div>

      <header className="masthead">
        <div className="masthead-top">
          <div className="logo-group">
            <span className="logo">🎬 Doomsday Ready</span>
            <Countdown compact />
          </div>
          <div className="row">
            <ThemeToggle />
            <div className="user">
              <span className="avatar" aria-hidden="true">{initial}</span>
              <span className="user-name">{user.name}{user.isGuest && <em>Guest</em>}</span>
              <button className="btn ghost small" onClick={logout}>Sign out</button>
            </div>
          </div>
        </div>

        <div>
          <h1>Hi {user.isGuest ? 'there' : user.name.split(' ')[0]} <span aria-hidden="true">👋</span></h1>
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

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="splash" aria-busy="true">🎬</div>;
  return user ? <Shell /> : <Landing />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <Gate />
      </AuthProvider>
    </ErrorBoundary>
  );
}