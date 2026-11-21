import cors from 'cors';
import express from 'express';
import { authenticate, authRouter, requireAuth } from './auth.js';
import { errorHandler, notFoundHandler } from './errors.js';
import { cinemasRouter } from './routes/cinemas.js';
import { moviesRouter } from './routes/movies.js';

/**
 * @param db            an open SQLite database
 * @param requireLogin  when true, /movies and /cinemas need a signed-in user.
 *                      Off by default so the API from the brief stays directly
 *                      testable (curl, Postman); the web app always signs in.
 *                      Turn on with REQUIRE_AUTH=true.
 */
export function createApp(db, { requireLogin = process.env.REQUIRE_AUTH === 'true' } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(authenticate(db));

  const guard = requireLogin ? [requireAuth] : [];

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter(db));
  app.use('/api/movies', ...guard, moviesRouter(db));
  app.use('/api/cinemas', ...guard, cinemasRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}