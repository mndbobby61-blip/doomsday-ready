import { Router } from 'express';
import { badRequest, conflict, notFound } from '../errors.js';
import { getRewatchOrder, wouldCreateCycle } from '../logic/rewatch.js';
import { movieCreateSchema, movieUpdateSchema, parse, parseId } from '../schemas.js';

export function moviesRouter(db) {
  const router = Router();

  const sql = {
    all: db.prepare('SELECT * FROM movies ORDER BY release_year, id'),
    byId: db.prepare('SELECT * FROM movies WHERE id = ?'),
    byTitle: db.prepare('SELECT id FROM movies WHERE title = ?'),
    insert: db.prepare(
      'INSERT INTO movies (title, release_year, runtime, watched, poster_url) VALUES (?, ?, ?, ?, ?)',
    ),
    update: db.prepare(
      'UPDATE movies SET title = ?, release_year = ?, runtime = ?, watched = ?, poster_url = ? WHERE id = ?',
    ),
    remove: db.prepare('DELETE FROM movies WHERE id = ?'),
    prereqsOf: db.prepare('SELECT prerequisite_id FROM movie_prerequisites WHERE movie_id = ? ORDER BY prerequisite_id'),
    allEdges: db.prepare('SELECT movie_id, prerequisite_id FROM movie_prerequisites ORDER BY prerequisite_id'),
    clearPrereqs: db.prepare('DELETE FROM movie_prerequisites WHERE movie_id = ?'),
    addPrereq: db.prepare('INSERT INTO movie_prerequisites (movie_id, prerequisite_id) VALUES (?, ?)'),
  };

  const serialize = (row, prerequisites) => ({
    id: row.id,
    title: row.title,
    releaseYear: row.release_year,
    runtime: row.runtime,
    watched: row.watched === 1,
    posterUrl: row.poster_url ?? null,
    prerequisites,
  });

  const getMovie = (id) => serialize(sql.byId.get(id), sql.prereqsOf.all(id).map((r) => r.prerequisite_id));

  /** Whole prerequisite graph as Map<movieId, prerequisiteIds[]>. */
  const loadGraph = () => {
    const graph = new Map();
    for (const { movie_id, prerequisite_id } of sql.allEdges.all()) {
      if (!graph.has(movie_id)) graph.set(movie_id, []);
      graph.get(movie_id).push(prerequisite_id);
    }
    return graph;
  };

  const uniqueIds = (ids) => [...new Set(ids)];

  const assertPrerequisitesExist = (ids) => {
    const missing = ids.filter((id) => !sql.byId.get(id));
    if (missing.length > 0) throw badRequest(`Prerequisite movie not found: ${missing.join(', ')}`);
  };

  const replacePrerequisites = (movieId, ids) => {
    sql.clearPrereqs.run(movieId);
    for (const prerequisiteId of ids) sql.addPrereq.run(movieId, prerequisiteId);
  };

  router.get('/', (req, res) => {
    const edges = loadGraph();
    res.json(sql.all.all().map((row) => serialize(row, edges.get(row.id) ?? [])));
  });

  router.post('/', (req, res) => {
    const data = parse(movieCreateSchema, req.body);
    if (sql.byTitle.get(data.title)) {
      throw conflict('DUPLICATE_TITLE', `A movie titled "${data.title}" already exists`);
    }
    const prerequisites = uniqueIds(data.prerequisites);
    assertPrerequisitesExist(prerequisites);
    // No cycle check needed here: a brand-new movie cannot be anyone's
    // prerequisite yet, so nothing can lead back to it.

    const id = db.transaction(() => {
      const { lastInsertRowid } = sql.insert.run(
        data.title,
        data.releaseYear,
        data.runtime,
        data.watched ? 1 : 0,
        data.posterUrl || null,
      );
      replacePrerequisites(Number(lastInsertRowid), prerequisites);
      return Number(lastInsertRowid);
    })();

    res.status(201).json(getMovie(id));
  });

  router.patch('/:id', (req, res) => {
    const id = parseId(req.params.id);
    const current = sql.byId.get(id);
    if (!current) throw notFound('Movie');

    const patch = parse(movieUpdateSchema, req.body);

    if (patch.title !== undefined) {
      const same = sql.byTitle.get(patch.title);
      if (same && same.id !== id) throw conflict('DUPLICATE_TITLE', `A movie titled "${patch.title}" already exists`);
    }

    let prerequisites;
    if (patch.prerequisites !== undefined) {
      prerequisites = uniqueIds(patch.prerequisites);
      assertPrerequisitesExist(prerequisites);
      if (wouldCreateCycle(id, prerequisites, loadGraph())) {
        throw conflict('CIRCULAR_DEPENDENCY', 'These prerequisites would make the movie depend on itself');
      }
    }

    db.transaction(() => {
      sql.update.run(
        patch.title ?? current.title,
        patch.releaseYear ?? current.release_year,
        patch.runtime ?? current.runtime,
        patch.watched === undefined ? current.watched : Number(patch.watched),
        patch.posterUrl === undefined ? current.poster_url : patch.posterUrl || null,
        id,
      );
      if (prerequisites) replacePrerequisites(id, prerequisites);
    })();

    res.json(getMovie(id));
  });

  router.delete('/:id', (req, res) => {
    const id = parseId(req.params.id);
    if (!sql.byId.get(id)) throw notFound('Movie');
    sql.remove.run(id); // links are removed by ON DELETE CASCADE
    res.status(204).end();
  });

  router.get('/:id/rewatch-order', (req, res) => {
    const id = parseId(req.params.id);
    const target = sql.byId.get(id);
    if (!target) throw notFound('Movie');

    const order = getRewatchOrder(id, loadGraph()).map(getMovie);
    const unwatched = order.filter((movie) => !movie.watched);

    res.json({
      target: { id: target.id, title: target.title },
      order,
      totalCount: order.length,
      watchedCount: order.length - unwatched.length,
      remainingRuntime: unwatched.reduce((sum, movie) => sum + movie.runtime, 0),
    });
  });

  return router;
}