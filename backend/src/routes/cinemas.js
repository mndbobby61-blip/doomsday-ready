import { Router } from 'express';
import { conflict, notFound } from '../errors.js';
import { calculateBooking } from '../logic/booking.js';
import { cinemaCreateSchema, groupSizeSchema, parse, parseId } from '../schemas.js';

export function cinemasRouter(db) {
  const router = Router();

  const sql = {
    all: db.prepare('SELECT * FROM cinemas ORDER BY name'),
    byId: db.prepare('SELECT * FROM cinemas WHERE id = ?'),
    byName: db.prepare('SELECT id FROM cinemas WHERE name = ?'),
    insert: db.prepare('INSERT INTO cinemas (name) VALUES (?)'),
    addBundle: db.prepare('INSERT INTO cinema_bundles (cinema_id, size) VALUES (?, ?)'),
    bundlesOf: db.prepare('SELECT size FROM cinema_bundles WHERE cinema_id = ? ORDER BY size'),
  };

  const getCinema = (row) => ({
    id: row.id,
    name: row.name,
    bundleSizes: sql.bundlesOf.all(row.id).map((bundle) => bundle.size),
  });

  router.get('/', (req, res) => {
    res.json(sql.all.all().map(getCinema));
  });

  router.post('/', (req, res) => {
    const data = parse(cinemaCreateSchema, req.body);
    if (sql.byName.get(data.name)) {
      throw conflict('DUPLICATE_NAME', `A cinema named "${data.name}" already exists`);
    }

    const id = db.transaction(() => {
      const cinemaId = Number(sql.insert.run(data.name).lastInsertRowid);
      for (const size of data.bundleSizes) sql.addBundle.run(cinemaId, size);
      return cinemaId;
    })();

    res.status(201).json(getCinema(sql.byId.get(id)));
  });

  router.get('/:id/booking', (req, res) => {
    const row = sql.byId.get(parseId(req.params.id));
    if (!row) throw notFound('Cinema');

    const groupSize = parse(groupSizeSchema, req.query.groupSize);
    const cinema = getCinema(row);
    const quote = calculateBooking(cinema.bundleSizes, groupSize);

    res.json({
      cinema,
      groupSize,
      ...quote,
      ...(!quote.possible && {
        message: `Not possible: ${groupSize} seats can't be made exactly from bundles of ${cinema.bundleSizes.join(', ')}`,
      }),
    });
  });

  return router;
}
