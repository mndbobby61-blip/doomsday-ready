import { useState } from 'react';
import AuthModal from '../components/AuthModal.jsx';
import Countdown from '../components/Countdown.jsx';
import Poster from '../components/Poster.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const SHOWCASE = [
  { title: 'Iron Man', releaseYear: 2008 },
  { title: 'Captain America: The First Avenger', releaseYear: 2011 },
  { title: 'The Avengers', releaseYear: 2012 },
  { title: 'Guardians of the Galaxy', releaseYear: 2014 },
  { title: 'Captain America: Civil War', releaseYear: 2016 },
  { title: 'Doctor Strange', releaseYear: 2016 },
  { title: 'Thor: Ragnarok', releaseYear: 2017 },
  { title: 'Black Panther', releaseYear: 2018 },
  { title: 'Avengers: Infinity War', releaseYear: 2018 },
  { title: 'Avengers: Endgame', releaseYear: 2019 },
  { title: 'Spider-Man: Homecoming', releaseYear: 2017 },
  { title: 'Avengers: Doomsday', releaseYear: 2026 },
];

/** One endlessly scrolling row. The list is doubled so the loop is seamless. */
function Row({ items, reverse, onPick }) {
  return (
    <div className={`marquee ${reverse ? 'reverse' : ''}`}>
      <div className="marquee-track">
        {[...items, ...items].map((movie, index) => (
          <Poster key={index} movie={movie} className="poster-landing" decorative={index >= items.length} onClick={onPick} />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'register'

  return (
    <div className="landing">
      <div className="blobs" aria-hidden="true"><i /><i /><i /></div>

      <header className="landing-bar">
        <span className="logo">🎬 Doomsday Ready</span>
        <div className="row">
          <ThemeToggle />
          <button className="btn ghost" onClick={() => setAuthMode('login')}>Sign in</button>
        </div>
      </header>

      <section className="hero">
        <p className="eyebrow">Avengers: Doomsday is coming</p>
        <h1>Rewatch smart.<br /><span className="gradient-text">Book together.</span></h1>
        <Countdown />
        <p className="hero-sub">
          Get the exact order to catch up on the saga, then lock in opening-night seats for your whole crew with zero empty seats.
        </p>
        <div className="row center">
          <button className="btn primary big" onClick={() => setAuthMode('register')}>Get started free</button>
          <button className="btn ghost big" onClick={() => setAuthMode('login')}>Sign in</button>
        </div>
        <p className="hint">Tap any poster to sign in</p>
      </section>

      <section className="showcase" aria-label="Movie posters">
        <Row items={SHOWCASE.slice(0, 6)} onPick={() => setAuthMode('login')} />
        <Row items={SHOWCASE.slice(6)} reverse onPick={() => setAuthMode('login')} />
      </section>

      <section className="pillars">
        <article><span>🧭</span><h3>Perfect rewatch order</h3><p>Every prerequisite, once, in an order that always makes sense.</p></article>
        <article><span>🎟️</span><h3>Exact-fit group booking</h3><p>The fewest seat bundles that add up to your group size, exactly.</p></article>
        <article><span>🔒</span><h3>Loop-proof</h3><p>Movies can never depend on themselves, directly or through others.</p></article>
      </section>

      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}
    </div>
  );
}