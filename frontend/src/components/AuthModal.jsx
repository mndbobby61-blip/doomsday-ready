import { useState } from 'react';
import { describeError } from '../api.js';
import { useAuth } from '../auth/AuthContext.jsx';
import useEscape from './useEscape.js';

export default function AuthModal({ initialMode = 'login', onClose }) {
  const { login, register, guest } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEscape(onClose);

  const isRegister = mode === 'register';
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      // On success the app swaps to the signed-in view, so there is nothing else to do.
    } catch (err) {
      setError(describeError(err));
      setBusy(false);
    }
  }

  function submit(event) {
    event.preventDefault();
    run(() =>
      isRegister
        ? register({ name: form.name, email: form.email, password: form.password })
        : login({ email: form.email, password: form.password }),
    );
  }

  return (
    <div className="backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 id="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        <p className="muted">
          {isRegister ? 'Save your rewatch progress and plan your watch party.' : 'Sign in to pick up where you left off.'}
        </p>

        <div className="segmented" role="tablist" aria-label="Sign in or create account">
          <button role="tab" aria-selected={!isRegister} onClick={() => { setMode('login'); setError(''); }}>Sign in</button>
          <button role="tab" aria-selected={isRegister} onClick={() => { setMode('register'); setError(''); }}>Create account</button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <label className="field">
              Your name
              <input required autoFocus autoComplete="name" value={form.name} onChange={set('name')} placeholder="Tony Stark" />
            </label>
          )}
          <label className="field">
            Email
            <input required autoFocus={!isRegister} type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
          </label>
          <label className="field">
            Password
            <span className="password-wrap">
              <input
                required
                minLength={isRegister ? 8 : undefined}
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={set('password')}
                placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              />
              <button type="button" className="link-btn" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="btn primary block" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <button className="btn ghost block" disabled={busy} onClick={() => run(guest)}>
          Continue as guest
        </button>
      </div>
    </div>
  );
}