import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import { ClientError, errorMiddleware } from './lib/index.js';

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Use SSL on Render, not locally
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

const app = express();

const reactStaticDir = new URL('../client/dist', import.meta.url).pathname;
const uploadsStaticDir = new URL('public', import.meta.url).pathname;

app.use(express.static(reactStaticDir));
app.use(express.static(uploadsStaticDir));
app.use(express.json());

/** Converts a UTC Date to a YYYY-MM-DD string without timezone drift. */
function utcDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** GET /api/entries?start=YYYY-MM-DD&end=YYYY-MM-DD */
app.get('/api/entries', async (req, res, next) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      throw new ClientError(400, 'start and end query params are required');
    }
    const result = await db.query(
      `SELECT * FROM "cycle_entries"
       WHERE "date" BETWEEN $1 AND $2
       ORDER BY "date" ASC`,
      [start, end]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/** POST /api/entries — create or upsert an entry for a date */
app.post('/api/entries', async (req, res, next) => {
  try {
    const { date, isPeriod, notes } = req.body;
    if (!date) throw new ClientError(400, 'date is required');

    const result = await db.query(
      `INSERT INTO "cycle_entries" ("date", "isPeriod", "notes")
       VALUES ($1, $2, $3)
       ON CONFLICT ("date") DO UPDATE
         SET "isPeriod"  = EXCLUDED."isPeriod",
             "notes"     = EXCLUDED."notes",
             "updatedAt" = now()
       RETURNING *`,
      [date, isPeriod ?? true, notes ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/entries/:date — update notes or isPeriod on an existing entry */
app.patch('/api/entries/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { isPeriod, notes } = req.body;

    const result = await db.query(
      `UPDATE "cycle_entries"
       SET "isPeriod"  = COALESCE($2, "isPeriod"),
           "notes"     = COALESCE($3, "notes"),
           "updatedAt" = now()
       WHERE "date" = $1
       RETURNING *`,
      [date, isPeriod ?? null, notes ?? null]
    );
    if (!result.rows[0]) {
      throw new ClientError(404, `No entry found for ${date}`);
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/entries/:date */
app.delete('/api/entries/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const result = await db.query(
      `DELETE FROM "cycle_entries" WHERE "date" = $1 RETURNING *`,
      [date]
    );
    if (!result.rows[0]) {
      throw new ClientError(404, `No entry found for ${date}`);
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/** GET /api/predict — return up to 3 predicted next period start dates */
app.get('/api/predict', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT "date" FROM "cycle_entries"
       WHERE "isPeriod" = true
       ORDER BY "date" ASC`
    );

    const dates: Date[] = result.rows.map(
      (r: { date: string }) => new Date(r.date)
    );

    if (dates.length === 0) {
      return res.json({ predictions: [], averageCycleLength: null });
    }

    // Build a fast-lookup set of date strings
    const dateSet = new Set(dates.map(utcDateStr));

    // A period "start" is a day NOT preceded by another period day
    const startDates = dates.filter((d) => {
      const prev = new Date(d);
      prev.setUTCDate(prev.getUTCDate() - 1);
      return !dateSet.has(utcDateStr(prev));
    });

    const lastStart = startDates[startDates.length - 1];
    let avgCycle = 28;
    let confidence: 'high' | 'medium' | 'low' = 'low';

    if (startDates.length >= 2) {
      const totalDays = startDates
        .slice(1)
        .reduce(
          (sum, d, i) =>
            sum +
            (d.getTime() - startDates[i].getTime()) / (1000 * 60 * 60 * 24),
          0
        );
      avgCycle = Math.round(totalDays / (startDates.length - 1));
      confidence = startDates.length >= 3 ? 'high' : 'medium';
    }

    const predictions = [1, 2, 3].map((i) => {
      const predicted = new Date(lastStart);
      predicted.setUTCDate(predicted.getUTCDate() + avgCycle * i);
      return { date: utcDateStr(predicted), confidence };
    });

    res.json({ predictions, averageCycleLength: avgCycle });
  } catch (err) {
    next(err);
  }
});

// ─── Fallback & Error ─────────────────────────────────────────────────────────

app.get('*', (req, res) => res.sendFile(`${reactStaticDir}/index.html`));
app.use(errorMiddleware);

app.listen(process.env.PORT, () => {
  console.log('Listening on port', process.env.PORT);
});
