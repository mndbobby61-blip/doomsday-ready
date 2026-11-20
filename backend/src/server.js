import { createApp } from './app.js';
import { openDb } from './db.js';
import { seedIfEmpty } from './seed.js';

const db = openDb();
if (process.env.SEED !== 'false') seedIfEmpty(db);

const port = Number(process.env.PORT) || 4000;
createApp(db).listen(port, () => {
  console.log(`Doomsday Ready API listening on http://localhost:${port}/api`);
});