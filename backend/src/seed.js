const MOVIES = [
  { title: 'Iron Man', year: 2008, runtime: 126, needs: [] },
  { title: 'Captain America: The First Avenger', year: 2011, runtime: 124, needs: [] },
  { title: 'The Avengers', year: 2012, runtime: 143, needs: ['Iron Man', 'Captain America: The First Avenger'] },
  { title: 'Captain America: Civil War', year: 2016, runtime: 147, needs: ['The Avengers'] },
  { title: 'Thor: Ragnarok', year: 2017, runtime: 130, needs: [] },
  { title: 'Avengers: Infinity War', year: 2018, runtime: 149, needs: ['Captain America: Civil War', 'Thor: Ragnarok'] },
  { title: 'Avengers: Endgame', year: 2019, runtime: 181, needs: ['Avengers: Infinity War'] },
  { title: 'Avengers: Doomsday', year: 2026, runtime: 150, needs: ['Avengers: Endgame'] },
];

const CINEMAS = [
  { name: 'Grand Premiere', bundleSizes: [6, 9, 20] },
  { name: 'Corner Screen', bundleSizes: [2, 5] },
  { name: 'Family Hall', bundleSizes: [1, 3, 4] },
  { name: 'Pair Palace', bundleSizes: [4, 6] },
];

export function seedIfEmpty(db) {
  const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;

  db.transaction(() => {
    if (count('movies') === 0) {
      const insert = db.prepare('INSERT INTO movies (title, release_year, runtime) VALUES (?, ?, ?)');
      const link = db.prepare('INSERT INTO movie_prerequisites (movie_id, prerequisite_id) VALUES (?, ?)');
      const ids = new Map();
      for (const movie of MOVIES) {
        ids.set(movie.title, Number(insert.run(movie.title, movie.year, movie.runtime).lastInsertRowid));
        for (const need of movie.needs) link.run(ids.get(movie.title), ids.get(need));
      }
    }
    if (count('cinemas') === 0) {
      const insert = db.prepare('INSERT INTO cinemas (name) VALUES (?)');
      const addBundle = db.prepare('INSERT INTO cinema_bundles (cinema_id, size) VALUES (?, ?)');
      for (const cinema of CINEMAS) {
        const id = Number(insert.run(cinema.name).lastInsertRowid);
        for (const size of cinema.bundleSizes) addBundle.run(id, size);
      }
    }
  })();
}