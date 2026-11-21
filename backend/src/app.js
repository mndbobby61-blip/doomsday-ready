import cors from 'cors';
import express from 'express';
import { errorHandler, notFoundHandler } from './errors.js';
import { cinemasRouter } from './routes/cinemas.js';
import { moviesRouter } from './routes/movies.js';

export function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/movies', moviesRouter(db));
  app.use('/api/cinemas', cinemasRouter(db));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}