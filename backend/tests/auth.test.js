import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../src/auth.js';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { seedIfEmpty } from '../src/seed.js';

describe('password hashing', () => {
  it('verifies the right password and rejects the wrong one', () => {
    const stored = hashPassword('correct horse battery');
    expect(stored).not.toContain('correct');
    expect(verifyPassword('correct horse battery', stored)).toBe(true);
    expect(verifyPassword('wrong password', stored)).toBe(false);
    expect(verifyPassword('anything', null)).toBe(false);
  });

  it('salts every hash differently', () => {
    expect(hashPassword('same-password')).not.toBe(hashPassword('same-password'));
  });
});

describe('auth API with login required', () => {
  let server;
  let base;

  beforeAll(async () => {
    const db = openDb(':memory:');
    seedIfEmpty(db);
    await new Promise((resolve) => {
      server = createApp(db, { requireLogin: true }).listen(0, resolve);
    });
    base = `http://127.0.0.1:${server.address().port}/api`;
  });
  afterAll(() => server.close());

  async function call(method, path, body, token) {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: res.status === 204 ? null : await res.json() };
  }

  it('blocks the API without a token', async () => {
    expect((await call('GET', '/movies')).status).toBe(401);
    expect((await call('GET', '/cinemas')).status).toBe(401);
    expect((await call('GET', '/health')).status).toBe(200);
  });

  it('registers, reads the profile, uses the API, then signs out', async () => {
    const created = await call('POST', '/auth/register', { name: 'Ava', email: 'Ava@Example.com', password: 'supersecret1' });
    expect(created.status).toBe(201);
    expect(created.body.user.email).toBe('ava@example.com');
    expect(created.body.user.passwordHash).toBeUndefined();
    const { token } = created.body;

    expect((await call('GET', '/auth/me', undefined, token)).body.name).toBe('Ava');
    expect((await call('GET', '/movies', undefined, token)).status).toBe(200);

    await call('POST', '/auth/logout', undefined, token);
    expect((await call('GET', '/movies', undefined, token)).status).toBe(401);
  });

  it('rejects duplicate emails, weak passwords and bad logins', async () => {
    await call('POST', '/auth/register', { name: 'Ben', email: 'ben@example.com', password: 'supersecret1' });
    expect((await call('POST', '/auth/register', { name: 'Ben', email: 'ben@example.com', password: 'supersecret1' })).status).toBe(409);
    expect((await call('POST', '/auth/register', { name: 'Cy', email: 'cy@example.com', password: 'short' })).status).toBe(400);
    expect((await call('POST', '/auth/login', { email: 'ben@example.com', password: 'wrong-password' })).status).toBe(401);
    expect((await call('POST', '/auth/login', { email: 'nobody@example.com', password: 'whatever123' })).status).toBe(401);
    expect((await call('POST', '/auth/login', { email: 'ben@example.com', password: 'supersecret1' })).status).toBe(200);
  });

  it('lets a guest in', async () => {
    const guest = await call('POST', '/auth/guest');
    expect(guest.status).toBe(201);
    expect(guest.body.user.isGuest).toBe(true);
    expect((await call('GET', '/movies', undefined, guest.body.token)).status).toBe(200);
  });

  it('stores and clears a poster link', async () => {
    const guest = (await call('POST', '/auth/guest')).body.token;
    const movie = await call('POST', '/movies', { title: 'Poster Test', releaseYear: 2020, runtime: 100, posterUrl: 'https://example.com/p.jpg' }, guest);
    expect(movie.body.posterUrl).toBe('https://example.com/p.jpg');
    const cleared = await call('PATCH', `/movies/${movie.body.id}`, { posterUrl: '' }, guest);
    expect(cleared.body.posterUrl).toBeNull();
    expect((await call('PATCH', `/movies/${movie.body.id}`, { posterUrl: 'javascript:alert(1)' }, guest)).status).toBe(400);
  });
});