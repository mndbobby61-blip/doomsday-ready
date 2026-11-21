import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { seedIfEmpty } from '../src/seed.js';

let server;
let base;

beforeAll(async () => {
  const db = openDb(':memory:');
  seedIfEmpty(db);
  await new Promise((resolve) => {
    server = createApp(db).listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(() => server.close());

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
}

const idOf = async (title) => (await call('GET', '/movies')).body.find((m) => m.title === title).id;

describe('movies API', () => {
  it('lists the seeded movies', async () => {
    const { status, body } = await call('GET', '/movies');
    expect(status).toBe(200);
    expect(body).toHaveLength(8);
  });

  it('rewatch order for Doomsday has 7 movies and the right totals', async () => {
    const id = await idOf('Avengers: Doomsday');
    const { body } = await call('GET', `/movies/${id}/rewatch-order`);
    expect(body.order).toHaveLength(7);
    expect(body.totalCount).toBe(7);
    expect(body.watchedCount).toBe(0);
    expect(body.remainingRuntime).toBe(126 + 124 + 143 + 147 + 130 + 149 + 181);
  });

  it('watched movies reduce the remaining runtime', async () => {
    const ironMan = await idOf('Iron Man');
    await call('PATCH', `/movies/${ironMan}`, { watched: true });
    const doomsday = await idOf('Avengers: Doomsday');
    const { body } = await call('GET', `/movies/${doomsday}/rewatch-order`);
    expect(body.watchedCount).toBe(1);
    expect(body.remainingRuntime).toBe(124 + 143 + 147 + 130 + 149 + 181);
  });

  it('rewatch order for Ragnarok is empty', async () => {
    const id = await idOf('Thor: Ragnarok');
    const { body } = await call('GET', `/movies/${id}/rewatch-order`);
    expect(body.order).toEqual([]);
  });

  it('rejects a circular dependency on update with 409', async () => {
    const ironMan = await idOf('Iron Man');
    const endgame = await idOf('Avengers: Endgame');
    const { status, body } = await call('PATCH', `/movies/${ironMan}`, { prerequisites: [endgame] });
    expect(status).toBe(409);
    expect(body.error).toBe('CIRCULAR_DEPENDENCY');
  });

  it('rejects a movie that requires itself', async () => {
    const ironMan = await idOf('Iron Man');
    const { status, body } = await call('PATCH', `/movies/${ironMan}`, { prerequisites: [ironMan] });
    expect(status).toBe(409);
    expect(body.error).toBe('CIRCULAR_DEPENDENCY');
  });

  it('creates a movie with prerequisites and enforces a unique title', async () => {
    const ironMan = await idOf('Iron Man');
    const created = await call('POST', '/movies', { title: 'Iron Man 2', releaseYear: 2010, runtime: 124, prerequisites: [ironMan] });
    expect(created.status).toBe(201);
    expect(created.body.prerequisites).toEqual([ironMan]);
    expect(created.body.watched).toBe(false);

    const duplicate = await call('POST', '/movies', { title: 'iron man 2', releaseYear: 2010, runtime: 124 });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toBe('DUPLICATE_TITLE');
  });

  it('validates runtime, ids and unknown prerequisites', async () => {
    expect((await call('POST', '/movies', { title: 'Too long', releaseYear: 2020, runtime: 301 })).status).toBe(400);
    expect((await call('POST', '/movies', { title: 'Ghost', releaseYear: 2020, runtime: 90, prerequisites: [9999] })).status).toBe(400);
    expect((await call('GET', '/movies/9999/rewatch-order')).status).toBe(404);
    expect((await call('GET', '/movies/abc/rewatch-order')).status).toBe(400);
  });
});

describe('cinemas API', () => {
  it('returns the booking quote', async () => {
    const cinemas = (await call('GET', '/cinemas')).body;
    const grand = cinemas.find((c) => c.name === 'Grand Premiere');
    const { status, body } = await call('GET', `/cinemas/${grand.id}/booking?groupSize=44`);
    expect(status).toBe(200);
    expect(body.totalBundles).toBe(4);
    expect(body.bundles).toEqual([
      { size: 20, count: 1 },
      { size: 9, count: 2 },
      { size: 6, count: 1 },
    ]);
  });

  it('says so when no exact combination exists', async () => {
    const pair = (await call('GET', '/cinemas')).body.find((c) => c.name === 'Pair Palace');
    const { body } = await call('GET', `/cinemas/${pair.id}/booking?groupSize=7`);
    expect(body.possible).toBe(false);
    expect(body.message).toMatch(/not possible/i);
  });

  it('creates cinemas and validates bundle sizes and group size', async () => {
    const created = await call('POST', '/cinemas', { name: 'Test Hall', bundleSizes: [3, 5] });
    expect(created.status).toBe(201);
    expect((await call('POST', '/cinemas', { name: 'test hall', bundleSizes: [3] })).status).toBe(409);
    expect((await call('POST', '/cinemas', { name: 'Bad', bundleSizes: [501] })).status).toBe(400);
    expect((await call('POST', '/cinemas', { name: 'Bad', bundleSizes: [2, 2] })).status).toBe(400);
    expect((await call('POST', '/cinemas', { name: 'Bad', bundleSizes: [] })).status).toBe(400);
    expect((await call('GET', `/cinemas/${created.body.id}/booking?groupSize=0`)).status).toBe(400);
    expect((await call('GET', `/cinemas/${created.body.id}/booking?groupSize=10001`)).status).toBe(400);
    expect((await call('GET', `/cinemas/${created.body.id}/booking`)).status).toBe(400);
    expect((await call('GET', '/cinemas/9999/booking?groupSize=3')).status).toBe(404);
  });
});