import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { AppError, conflict, unauthorized } from './errors.js';
import { parse } from './schemas.js';

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/** scrypt with a random salt, stored as "salt:hash" (both hex). */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(actual, expected); // constant-time comparison
}

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(120),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

/** Tiny in-memory limiter: 20 sign-in or sign-up attempts per minute per address. */
const attempts = new Map();
function limitAttempts(req, res, next) {
  const now = Date.now();
  const recent = (attempts.get(req.ip) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 20) {
    return next(new AppError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts. Please wait a minute and try again.'));
  }
  recent.push(now);
  attempts.set(req.ip, recent);
  return next();
}

/** Reads "Authorization: Bearer <token>" and sets req.user (or null). */
export function authenticate(db) {
  const find = db.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?',
  );
  return (req, res, next) => {
    const header = req.get('authorization') ?? '';
    req.token = header.startsWith('Bearer ') ? header.slice(7) : null;
    req.user = req.token ? (find.get(sha256(req.token), Date.now()) ?? null) : null;
    next();
  };
}

export function requireAuth(req, res, next) {
  next(req.user ? undefined : unauthorized());
}

export function authRouter(db) {
  const router = Router();

  const sql = {
    byEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
    byId: db.prepare('SELECT * FROM users WHERE id = ?'),
    insertUser: db.prepare(
      'INSERT INTO users (name, email, password_hash, is_guest, created_at) VALUES (?, ?, ?, ?, ?)',
    ),
    insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
    deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
    purgeExpired: db.prepare('DELETE FROM sessions WHERE expires_at < ?'),
  };

  const publicUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.is_guest ? null : user.email,
    isGuest: user.is_guest === 1,
  });

  function startSession(user) {
    sql.purgeExpired.run(Date.now());
    const token = crypto.randomBytes(32).toString('hex');
    sql.insertSession.run(sha256(token), user.id, Date.now() + SESSION_MS);
    return { user: publicUser(user), token };
  }

  router.post('/register', limitAttempts, (req, res) => {
    const data = parse(registerSchema, req.body);
    if (sql.byEmail.get(data.email)) throw conflict('EMAIL_TAKEN', 'An account with this email already exists');
    const { lastInsertRowid } = sql.insertUser.run(data.name, data.email, hashPassword(data.password), 0, Date.now());
    res.status(201).json(startSession(sql.byId.get(Number(lastInsertRowid))));
  });

  router.post('/login', limitAttempts, (req, res) => {
    const data = parse(loginSchema, req.body);
    const user = sql.byEmail.get(data.email);
    // Same message for "no such user" and "wrong password", so emails cannot be probed.
    if (!user || !verifyPassword(data.password, user.password_hash)) {
      throw unauthorized('Incorrect email or password');
    }
    res.json(startSession(user));
  });

  router.post('/guest', limitAttempts, (req, res) => {
    const suffix = crypto.randomBytes(6).toString('hex');
    const { lastInsertRowid } = sql.insertUser.run('Guest', `guest-${suffix}@guest.local`, null, 1, Date.now());
    res.status(201).json(startSession(sql.byId.get(Number(lastInsertRowid))));
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json(publicUser(req.user));
  });

  router.post('/logout', (req, res) => {
    if (req.token) sql.deleteSession.run(sha256(req.token));
    res.status(204).end();
  });

  return router;
}